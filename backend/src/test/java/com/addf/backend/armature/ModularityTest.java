package com.addf.backend.armature;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import org.jmolecules.archunit.JMoleculesArchitectureRules;
import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

/**
 * The backend's architecture rules as tests (ADR-0008): module boundaries hold, and hexagonal roles
 * marked with jMolecules point the right way. A failure here means a change crossed a boundary a
 * reviewer should see, not a flaky test.
 */
class ModularityTest {

    static final ApplicationModules MODULES = ApplicationModules.of(ArmatureApplication.class);

    @Test
    void modulesRespectTheirDeclaredBoundaries() {
        // No cycles, no access to another module's internal packages, only declared dependencies.
        MODULES.verify();
    }

    @Test
    void hexagonalRolesPointInward() {
        JavaClasses classes = new ClassFileImporter()
                .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
                .importPackages("com.addf.backend.armature");

        JMoleculesArchitectureRules.ensureHexagonal().check(classes);
    }
}
