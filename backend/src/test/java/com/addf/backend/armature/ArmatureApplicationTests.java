package com.addf.backend.armature;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

// The app pulls the Ollama model at startup when it is missing, which needs a running Ollama.
// This test only checks that the context starts, so it must pass without one (as in CI).
@SpringBootTest(properties = "spring.ai.ollama.init.pull-model-strategy=never")
class ArmatureApplicationTests {

    @Test
    void contextLoads() {
    }

}
