package slug

import "testing"

func TestMake(t *testing.T) {
	tests := []struct {
		in   string
		want string
	}{
		{"Postgres connection refused", "postgres-connection-refused"},
		{"Postgres: connexion refusée", "postgres-connexion-refusee"},
		{"  Docker -- build   fails!  ", "docker-build-fails"},
		{"CI/CD pipeline v2.1", "ci-cd-pipeline-v2-1"},
		{"Ça déraille à 100 %", "ca-deraille-a-100"},
		{"Base de données", "base-de-donnees"},
		{"Sécurité", "securite"},
		{"Système", "systeme"},
		{"Réseau", "reseau"},
		{"!!!", ""},
		{"", ""},
		{"日本語", ""},
	}

	for _, tt := range tests {
		if got := Make(tt.in); got != tt.want {
			t.Errorf("Make(%q) = %q, want %q", tt.in, got, tt.want)
		}
	}
}
