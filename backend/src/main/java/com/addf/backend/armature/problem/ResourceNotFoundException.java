package com.addf.backend.armature.problem;

/** A resource named by id does not exist: the {@code resource-not-found} problem. */
public class ResourceNotFoundException extends ProblemException {

    public ResourceNotFoundException(String resourceType, String id) {
        super(ProblemType.RESOURCE_NOT_FOUND, "There is no " + resourceType + " with id '" + id + "'.");
    }
}
