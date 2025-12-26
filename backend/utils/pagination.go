package utils

import "math"

type Pagination struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	TotalRows  int64 `json:"total_rows"`
	TotalPages int   `json:"total_pages"`
}

func Paginate(page, limit int, totalRows int64) Pagination {
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 10
	}

	totalPages := int(math.Ceil(float64(totalRows) / float64(limit)))

	return Pagination{
		Page:       page,
		Limit:      limit,
		TotalRows:  totalRows,
		TotalPages: totalPages,
	}
}
