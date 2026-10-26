package com.addf.backend.armature;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.client.RestTestClient;
import org.springframework.web.context.WebApplicationContext;

/**
 * Base for tests that call the HTTP API through the whole application (MockMvc underneath, no
 * port). Every subclass shares one application context, so tests must not assume an empty
 * repository: each creates what it reads, and filters by what it created.
 */
@SpringBootTest(properties = "spring.ai.ollama.init.pull-model-strategy=never")
public abstract class ApiTest {

    @Autowired
    private WebApplicationContext context;

    protected RestTestClient client;

    @BeforeEach
    void bindClient() {
        client = RestTestClient.bindToApplicationContext(context).build();
    }
}
