import { json } from '@sveltejs/kit';
import { DEEPSEEK_API_KEY } from '$env/static/private';

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const SESSION_COOKIE = 'thrive_search_session';
const MAX_HISTORY = 20;

const sessions = new Map();

function systemFor(catalog) {
	return `You are a resource librarian for the Thrive Regional Data Hub. You answer questions about a catalog of approved tools/resources related to regional planning and community data for the greater Chattanooga region (Thrive Regional Partnership).

Context (the full catalog, always available):
${JSON.stringify(catalog)}

Rules:
- If the user's query is about the catalog or about regional planning/community data topics, rank the tools by genuine relevance to the query across title, sector, summary, details, type, and author.
- Return EVERY tool, sorted from most relevant to least relevant. Do not drop items.
- If the query is unrelated to the catalog or to regional planning and community data topics (for example cooking recipes, sports scores, or general knowledge), do NOT rank. Instead respond with: {"ids": [], "reasoning": "Query out of Context"}
- Keep the reasoning to 2-3 sentences, plain language, no markdown.
- Respond with ONLY valid JSON in this exact shape:
  {"ids": ["<globalid>", ...], "reasoning": "..."}
  or, when out of context: {"ids": [], "reasoning": "Query out of Context"}`;
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
	const { query, tools } = await request.json();

	if (!query || typeof query !== 'string' || !query.trim()) {
		return json({ error: 'Missing query' }, { status: 400 });
	}
	if (!DEEPSEEK_API_KEY) {
		return json({ error: 'DEEPSEEK_API_KEY not configured on server' }, { status: 500 });
	}

	let sessionId = cookies.get(SESSION_COOKIE);
	let session = sessionId ? sessions.get(sessionId) : null;

	if (!session) {
		sessionId = crypto.randomUUID();
		session = { catalog: [], messages: [] };
		sessions.set(sessionId, session);
		cookies.set(SESSION_COOKIE, sessionId, { path: '/' });
	}

	const messages = session.messages;
	const isNewCatalog = session.catalog.length === 0;

	if (isNewCatalog) {
		if (!Array.isArray(tools) || tools.length === 0) {
			return json({ error: 'Missing tools' }, { status: 400 });
		}
		session.catalog = tools.map((t) => ({
			id: t.attributes.globalid,
			title: t.attributes.title,
			sector: t.attributes.sector_tags,
			author: t.attributes.author,
			type: t.attributes.tool_type,
			summary: t.attributes.summary,
			details: t.attributes.field_9
		}));
	}

	if (messages.length === 0) {
		messages.push({ role: 'system', content: systemFor(session.catalog) });
	}

	messages.push({ role: 'user', content: `User query: ${query}` });

	// Prune old turns, but always keep the system message (messages[0])
	if (messages.length - 1 > MAX_HISTORY) {
		const system = messages[0];
		messages.splice(1, messages.length - 1 - MAX_HISTORY);
		messages[0] = system;
	}

	const response = await fetch(DEEPSEEK_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${DEEPSEEK_API_KEY}`
		},
		body: JSON.stringify({
			model: 'deepseek-v4-flash',
			response_format: { type: 'json_object' },
			reasoning_effort: 'low',
			messages
		})
	});

	if (!response.ok) {
		const body = await response.text();
		return json(
			{ error: `DeepSeek request failed (${response.status})`, detail: body },
			{ status: 502 }
		);
	}

	const data = await response.json();
	const content = data.choices?.[0]?.message?.content;

	try {
		const parsed = JSON.parse(content);
		const reasoning = typeof parsed.reasoning === 'string' ? parsed.reasoning : '';

		if (reasoning === 'Query out of Context') {
			messages.push({ role: 'assistant', content });
			return json({ ids: [], reasoning, outOfContext: true });
		}

		const rankedIds = Array.isArray(parsed.ids) ? parsed.ids : [];
		const catalogIds = session.catalog.map((t) => t.id);
		const missing = catalogIds.filter((id) => !rankedIds.includes(id));
		const ids = [...new Set([...rankedIds, ...missing])];
		messages.push({ role: 'assistant', content });
		return json({ ids, reasoning, outOfContext: false });
	} catch {
		return json({ error: 'DeepSeek returned invalid JSON', content }, { status: 502 });
	}
}
