package com.addf.backend.armature.problem;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import org.junit.jupiter.api.Test;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;

/**
 * Only the problem factory makes error bodies (plan, "Enforcement"). A module that wants to refuse
 * a request throws a {@link ProblemException}; it never builds a {@link ProblemDetail} or an empty
 * error {@link ResponseEntity} itself.
 */
class ProblemArchitectureTest {

    private final JavaClasses classes = new ClassFileImporter()
            .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
            .importPackages("com.addf.backend.armature");

    @Test
    void onlyProblemBuilderCreatesProblemDetails() {
        noClasses().that().doNotHaveFullyQualifiedName(ProblemBuilder.class.getName())
                .should().callMethodWhere(DescribedPredicate.describe("ProblemDetail.forStatus...",
                        call -> call.getTarget().getOwner().isEquivalentTo(ProblemDetail.class)
                                && call.getTarget().getName().startsWith("forStatus")))
                .orShould().callConstructor(ProblemDetail.class)
                .because("every error body is an RFC 9457 problem built by ProblemBuilder (ADR-0019)")
                .check(classes);
    }

    @Test
    void noControllerAnswersAnErrorWithoutAProblem() {
        noClasses().should().callMethod(ResponseEntity.class, "notFound")
                .orShould().callMethod(ResponseEntity.class, "badRequest")
                .orShould().callMethod(ResponseEntity.class, "unprocessableEntity")
                .orShould().callMethod(ResponseEntity.class, "internalServerError")
                .because("an error is a ProblemException, so it reaches the client as a problem with a help page")
                .check(classes);
    }
}
