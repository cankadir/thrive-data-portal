/**
 * Hard bounds for every sector map: the Thrive region. Used as the initial
 * extent and as the MapView `constraints.geometry`, so the user can never pan
 * outside it.
 */
export const regionExtent = {
	type: 'extent',
	xmin: -86.6,
	ymin: 33.85,
	xmax: -84.0,
	ymax: 36.25,
	spatialReference: { wkid: 4326 }
};
