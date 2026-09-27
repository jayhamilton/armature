package com.addf.backend.armature.patterns;

/**
 * The design patterns Armature uses on purpose, as listed in the plan's initial pattern catalog.
 * Each annotated type names its pattern page through {@link DesignPattern#doc()}.
 */
public enum Pattern {
    STATE("State"),
    STRATEGY_REGISTRY("Strategy with registry"),
    ADAPTER("Adapter"),
    CHAIN_OF_RESPONSIBILITY("Chain of Responsibility"),
    DECORATOR("Decorator"),
    OBSERVER("Observer"),
    COMMAND("Command with undo"),
    COMPOSITE("Composite"),
    INTERPRETER_SPECIFICATION("Interpreter and Specification"),
    BUILDER("Builder"),
    MEDIATOR("Mediator");

    private final String title;

    Pattern(String title) {
        this.title = title;
    }

    /** Human readable name, as used in the catalog. */
    public String title() {
        return title;
    }
}
