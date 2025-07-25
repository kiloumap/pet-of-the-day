package domain

type Species string

const (
	SpeciesDog  Species = "dog"
	SpeciesCat  Species = "cat"
	SpeciesBird Species = "bird"
)

func (s Species) IsValid() bool {
	switch s {
	case SpeciesDog, SpeciesCat, SpeciesBird:
		return true
	default:
		return false
	}
}
