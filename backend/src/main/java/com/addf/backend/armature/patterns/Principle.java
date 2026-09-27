package com.addf.backend.armature.patterns;

/** The SOLID principles, as named in the plan's "SOLID, applied concretely" section. */
public enum Principle {
    SINGLE_RESPONSIBILITY("Single responsibility"),
    OPEN_CLOSED("Open/Closed"),
    LISKOV_SUBSTITUTION("Liskov substitution"),
    INTERFACE_SEGREGATION("Interface segregation"),
    DEPENDENCY_INVERSION("Dependency inversion");

    private final String title;

    Principle(String title) {
        this.title = title;
    }

    /** Human readable name, as used in the catalog. */
    public String title() {
        return title;
    }
}
