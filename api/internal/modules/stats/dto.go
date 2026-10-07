package stats

// Stats is the response body of GET /stats.
type Stats struct {
	// Total and ByStatus count incidents of every status; ByStatus always
	// has the draft, published and archived keys, zero included.
	Total      int64            `json:"total"`
	ByStatus   map[string]int64 `json:"by_status"`
	Categories []CategoryCount  `json:"categories"`
	TopTags    []TagCount       `json:"top_tags"`
	Recent     []RecentIncident `json:"recent"`
	// Activity is the number of incidents created per week, oldest first,
	// over the last activityWeeks weeks including the current one.
	Activity []WeekCount `json:"activity"`
}

// CategoryCount is a category with its number of incidents.
type CategoryCount struct {
	Name          string `json:"name"`
	Slug          string `json:"slug"`
	IncidentCount int64  `json:"incident_count"`
}

// TagCount is a tag with its number of incidents.
type TagCount struct {
	Name          string `json:"name"`
	Slug          string `json:"slug"`
	IncidentCount int64  `json:"incident_count"`
}

// RecentIncident is a recently updated incident.
type RecentIncident struct {
	Title     string   `json:"title"`
	Slug      string   `json:"slug"`
	Status    string   `json:"status"`
	Category  Category `json:"category"`
	UpdatedAt string   `json:"updated_at"`
}

// Category is the category a recent incident belongs to.
type Category struct {
	Name string `json:"name"`
	Slug string `json:"slug"`
}

// WeekCount is the number of incidents created in the week starting on
// WeekStart (a Monday, YYYY-MM-DD).
type WeekCount struct {
	WeekStart string `json:"week_start"`
	Total     int64  `json:"total"`
}
