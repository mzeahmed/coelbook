package incident

// Category is the public representation of the category an incident
// belongs to.
type Category struct {
	Name string `json:"name"`
	Slug string `json:"slug"`
}

// Author is the public representation of an incident's author.
type Author struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

// Summary is the public representation of an incident in a listing.
type Summary struct {
	ID        string   `json:"id"`
	Title     string   `json:"title"`
	Slug      string   `json:"slug"`
	Summary   string   `json:"summary"`
	Status    string   `json:"status"`
	Category  Category `json:"category"`
	Author    Author   `json:"author"`
	Tags      []string `json:"tags"`
	CreatedAt string   `json:"created_at"`
	UpdatedAt string   `json:"updated_at"`
}

// ListFilter holds the optional filters accepted by GET /incidents.
type ListFilter struct {
	Category string
	Status   string
	Tag      string
	Query    string
	Page     int
	PerPage  int
}

// ListResponse is the response body of GET /incidents.
type ListResponse struct {
	Incidents []Summary `json:"incidents"`
	Total     int64     `json:"total"`
	Page      int       `json:"page"`
	PerPage   int       `json:"per_page"`
}
