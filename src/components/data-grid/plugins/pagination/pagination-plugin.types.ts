export interface IPaginationPluginOptions {
	pageSize?: number;
	pageSizeOptions?: number[];
	/** When true, server is paginating; the plugin won't slice items locally. */
	serverSide?: boolean;
	showPageSizeSelector?: boolean;
}

export interface IPaginationViewModel {
	pageCount: number;
	current: number;
	start: number;
	end: number;
	total: number;
}
