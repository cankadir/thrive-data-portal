<script>
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	const IMAGE_MAX = 25 * 1024 * 1024;
	const VIDEO_MAX = 10 * 1024 * 1024;

	const VIDEO_TYPES = [
		'video/mp4',
		'video/quicktime',
		'video/x-m4v',
		'video/webm',
		'video/x-msvideo',
		'video/x-matroska',
		'video/mpeg'
	];
	const VIDEO_EXT = ['mp4', 'mov', 'm4v', 'webm', 'avi', 'mkv', 'mpeg', 'mpg'];

	let pending = $state({});
	let removed = $state([]);
	let submitting = $state(false);
	let progress = $state(0);
	let message = $state(null);
	let done = $state(false);

	const TYPES = {
		image: { accept: 'image/jpeg,image/png', hint: 'JPEG or PNG · resized to 1280px' },
		video: {
			accept: '.mp4,.mov,.m4v,.webm,.avi,.mkv,.mpeg,.mpg,video/*',
			hint: 'MP4, MOV, M4V, WEBM · up to 10 MB'
		}
	};

	function isVideo(file) {
		if (VIDEO_TYPES.includes(file.type)) return true;
		const ext = file.name.split('.').pop()?.toLowerCase();
		return VIDEO_EXT.includes(ext);
	}

	const changes = $derived(Object.keys(pending).length + removed.length);
	const dirty = $derived(changes > 0);

	function filesFor(keyword) {
		return data.attachments.filter((a) => a.keywords === keyword);
	}

	function isRemoved(id) {
		return removed.includes(id);
	}

	function formatSize(bytes) {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
		return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
	}

	function post(url, formData) {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open('POST', `${url}?f=json`);
			xhr.onload = () => {
				try {
					resolve(JSON.parse(xhr.responseText));
				} catch {
					reject(new Error(`Unexpected response (${xhr.status})`));
				}
			};
			xhr.onerror = () => reject(new Error('Network error'));
			xhr.send(formData);
		});
	}

	function pick(slot, file) {
		if (!file) return;
		message = null;
		const max = slot.kind === 'image' ? IMAGE_MAX : VIDEO_MAX;
		if (file.size > max) {
			message = { tone: 'error', text: `"${file.name}" is larger than ${formatSize(max)}.` };
			return;
		}
		if (slot.kind === 'image' && !file.type.startsWith('image/')) {
			message = { tone: 'error', text: 'Images must be JPEG or PNG.' };
			return;
		}
		if (slot.kind === 'video' && !isVideo(file)) {
			message = { tone: 'error', text: 'The video must be MP4, MOV, M4V, WEBM, AVI, MKV or MPEG.' };
			return;
		}
		const previous = pending[slot.keyword];
		if (previous?.previewUrl) URL.revokeObjectURL(previous.previewUrl);
		pending[slot.keyword] = {
			file,
			previewUrl: slot.kind === 'image' ? URL.createObjectURL(file) : null
		};
	}

	function clearPending(slot) {
		const chosen = pending[slot.keyword];
		if (chosen?.previewUrl) URL.revokeObjectURL(chosen.previewUrl);
		delete pending[slot.keyword];
	}

	function toggleRemove(id) {
		removed = isRemoved(id) ? removed.filter((x) => x !== id) : [...removed, id];
	}

	async function resizeImage(file, max = 1280) {
		const bitmap = await createImageBitmap(file);
		if (bitmap.width <= max && bitmap.height <= max) {
			bitmap.close?.();
			return file;
		}
		const scale = max / Math.max(bitmap.width, bitmap.height);
		const canvas = document.createElement('canvas');
		canvas.width = Math.round(bitmap.width * scale);
		canvas.height = Math.round(bitmap.height * scale);
		canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
		bitmap.close?.();
		const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
		if (!blob) return file;
		return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
	}

	async function deleteAttachment(id) {
		const fd = new FormData();
		fd.append('attachmentIds', String(id));
		const json = await post(`${data.attachUrl}/deleteAttachments`, fd);
		if (json.error) throw new Error(json.error.message ?? 'Delete failed');
	}

	async function addAttachment(slot, file) {
		const payload = slot.kind === 'image' ? await resizeImage(file) : file;
		const fd = new FormData();
		fd.append('keywords', slot.keyword);
		fd.append('attachment', payload, payload.name);
		const json = await post(`${data.attachUrl}/addAttachment`, fd);
		if (json.error) throw new Error(json.error.message ?? 'Upload failed');
		if (!json.addAttachmentResult?.success) throw new Error('Upload rejected by the server');
	}

	async function submit() {
		const ops = [];
		for (const slot of data.slots) {
			const chosen = pending[slot.keyword];
			if (chosen) {
				for (const a of filesFor(slot.keyword)) ops.push({ type: 'delete', id: a.id });
				ops.push({ type: 'add', slot, file: chosen.file });
			} else {
				for (const a of filesFor(slot.keyword)) {
					if (isRemoved(a.id)) ops.push({ type: 'delete', id: a.id });
				}
			}
		}
		if (ops.length === 0) return;

		submitting = true;
		message = null;
		progress = 0;
		try {
			let step = 0;
			for (const op of ops) {
				if (op.type === 'delete') await deleteAttachment(op.id);
				else await addAttachment(op.slot, op.file);
				step += 1;
				progress = Math.round((step / ops.length) * 100);
			}
			await invalidateAll();
			for (const key of Object.keys(pending)) {
				if (pending[key].previewUrl) URL.revokeObjectURL(pending[key].previewUrl);
			}
			pending = {};
			removed = [];
			done = true;
		} catch (err) {
			message = { tone: 'error', text: err.message };
		} finally {
			submitting = false;
			progress = 0;
		}
	}
</script>

<svelte:head>
	<title>{data.title} · Photos</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="photo-page">
	<header>
		<a class="back" href="/forms/{data.slug}">&larr; All records</a>
		<h1>Photos &amp; video</h1>
		<p class="project">{data.label}</p>
	</header>

	{#if done}
		<section class="done-box">
			<h2>Photos submitted</h2>
			<p>
				The photos are submitted to row <code>{data.globalId}</code> ({data.label}). You can go back
				to all records.
			</p>
			<p>
				<a href="/forms/{data.slug}">← Back to all records</a>
			</p>
			<button class="ghost" type="button" onclick={() => (done = false)}>
				Add or remove more photos
			</button>
		</section>
	{:else}
		<div class="slots">
			{#each data.slots as slot (slot.keyword)}
				{@const existing = filesFor(slot.keyword)}
				{@const chosen = pending[slot.keyword]}
				{@const type = TYPES[slot.kind]}
				<section class="slot">
					<div class="slot-head">
						<h2>{slot.label}</h2>
						<span class="hint">{type.hint}</span>
					</div>

					{#if chosen}
						<div class="file">
							{#if chosen.previewUrl}
								<img src={chosen.previewUrl} alt="" />
							{:else}
								<span class="file-icon">Video</span>
							{/if}
							<div class="file-meta">
								<span class="file-name">{chosen.file.name}</span>
								<span class="file-size">{formatSize(chosen.file.size)}</span>
							</div>
							<button
								class="ghost"
								type="button"
								onclick={() => clearPending(slot)}
								disabled={submitting}
							>
								Clear
							</button>
						</div>
					{:else if existing.length}
						<ul class="files">
							{#each existing as a (a.id)}
								<li class:removed={isRemoved(a.id)}>
									{#if slot.kind === 'image' && a.contentType.startsWith('image/')}
										<img src="{data.attachUrl}/attachments/{a.id}" alt={a.name} />
									{:else}
										<span class="file-icon">{slot.kind === 'video' ? 'Video' : 'File'}</span>
									{/if}
									<div class="file-meta">
										<span class="file-name">{a.name}</span>
										<span class="file-size">{formatSize(a.size)}</span>
									</div>
									<button
										class="ghost"
										type="button"
										onclick={() => toggleRemove(a.id)}
										disabled={submitting}
									>
										{isRemoved(a.id) ? 'Undo' : 'Remove'}
									</button>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="empty">No file yet.</p>
					{/if}

					<label class="picker">
						<input
							type="file"
							accept={type.accept}
							disabled={submitting}
							onchange={(e) => {
								pick(slot, e.currentTarget.files?.[0]);
								e.currentTarget.value = '';
							}}
						/>
						<span>{chosen || existing.length ? 'Choose different file' : 'Choose file'}</span>
					</label>
				</section>
			{/each}
		</div>

		<div class="actions">
			{#if message}
				<p class={message.tone}>{message.text}</p>
			{/if}
			{#if submitting}
				<div class="progress"><div style="width: {progress}%"></div></div>
			{/if}
			<button class="submit" type="button" onclick={submit} disabled={!dirty || submitting}>
				{submitting
					? `Saving… ${progress}%`
					: changes > 0
						? `Save ${changes} change${changes > 1 ? 's' : ''}`
						: 'Save changes'}
			</button>
		</div>
	{/if}
</main>

<style>
	.photo-page {
		max-width: 760px;
		margin: 0 auto;
		padding: 2rem 1.5rem 4rem;
	}

	.back {
		color: #3064b2;
		text-decoration: none;
		font-weight: 600;
	}

	.back:hover {
		text-decoration: underline;
	}

	h1 {
		margin: 0.4rem 0 0.15rem;
		font-size: 1.6rem;
	}

	.project {
		margin: 0;
		font-weight: 600;
	}

	.done-box {
		margin-top: 1.25rem;
		padding: 1rem 1.1rem;
		border: 1px solid #a3c074;
		border-radius: 8px;
		background: #eef4e6;
	}

	.done-box h2 {
		margin: 0 0 0.5rem;
		font-size: 1.1rem;
		color: #588c02;
	}

	.done-box p {
		margin: 0 0 0.6rem;
	}

	.done-box code {
		font-size: 0.8rem;
	}

	.slots {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 1.25rem;
	}

	.slot {
		border: 1px solid #d6d6ce;
		border-radius: 8px;
		padding: 0.75rem 0.9rem;
	}

	.slot-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
	}

	.slot-head h2 {
		margin: 0;
		font-size: 1rem;
	}

	.hint {
		color: #99968d;
		font-size: 0.75rem;
	}

	.file,
	.files li {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.files {
		list-style: none;
		margin: 0.6rem 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.files li.removed {
		opacity: 0.45;
	}

	.files li.removed .file-name {
		text-decoration: line-through;
	}

	.file {
		margin-top: 0.6rem;
	}

	img,
	.file-icon {
		width: 44px;
		height: 44px;
		border-radius: 5px;
		object-fit: cover;
		flex: none;
	}

	img {
		border: 1px solid #d6d6ce;
	}

	.file-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f0f0f0;
		color: #656364;
		font-size: 0.7rem;
		font-weight: 600;
	}

	.file-meta {
		display: flex;
		flex-direction: column;
		min-width: 0;
		flex: 1;
	}

	.file-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.9rem;
	}

	.file-size {
		color: #99968d;
		font-size: 0.75rem;
	}

	.empty {
		margin: 0.5rem 0 0;
		color: #99968d;
		font-size: 0.9rem;
	}

	.ghost {
		padding: 0.25rem 0.55rem;
		border: 1px solid #d6d6ce;
		border-radius: 5px;
		background: #fff;
		color: #656364;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
	}

	.ghost:hover:not(:disabled) {
		border-color: #d9542b;
		color: #d9542b;
	}

	.ghost:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.picker {
		display: inline-block;
		margin-top: 0.6rem;
	}

	.picker input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
	}

	.picker span {
		display: inline-block;
		padding: 0.3rem 0.7rem;
		border: 1px solid #3064b2;
		border-radius: 5px;
		color: #3064b2;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
	}

	.picker:hover span {
		background: #3064b2;
		color: #fff;
	}

	.actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 1.25rem;
	}

	.actions p {
		margin: 0 auto 0 0;
		font-weight: 600;
	}

	.error {
		color: #d9542b;
	}

	.progress {
		width: 120px;
		height: 6px;
		border-radius: 999px;
		background: #f0f0f0;
		overflow: hidden;
	}

	.progress div {
		height: 100%;
		background: #008fa8;
		transition: width 120ms ease;
	}

	.submit {
		padding: 0.5rem 1.2rem;
		border: 1px solid #3064b2;
		border-radius: 6px;
		background: #3064b2;
		color: #fff;
		font-weight: 600;
		cursor: pointer;
	}

	.submit:hover:not(:disabled) {
		background: #25518f;
		border-color: #25518f;
	}

	.submit:disabled {
		background: #f0f0f0;
		border-color: #d6d6ce;
		color: #99968d;
		cursor: default;
	}
</style>
