// Package password hashes and verifies user credentials, so callers never
// handle a plaintext password beyond the request that carries it.
package password

import "golang.org/x/crypto/bcrypt"

// Hash returns the bcrypt hash of a plaintext password, suitable for
// storage in users.password_hash.
func Hash(plain string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}

	return string(hash), nil
}

// Compare returns nil if plain matches hash, or an error otherwise.
func Compare(hash, plain string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain))
}