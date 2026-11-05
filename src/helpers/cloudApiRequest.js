const { withPolicyRequestHeaders } = require("./policyRequestHeaders");

class AuthContextError extends Error {
  constructor(message, code = "AUTH_CONTEXT_CHANGED") {
    super(message);
    this.name = "AuthContextError";
    this.code = code;
  }
}

function authFailure(error) {
  return {
    success: false,
    error: error.message,
    code: error.code,
    status: 0,
  };
}

function captureAuthFence(tokenStore, expectedGeneration) {
  if (!Number.isSafeInteger(expectedGeneration) || expectedGeneration < 0) {
    throw new AuthContextError(
      "Authenticated request has no validated credential generation",
      "AUTH_CONTEXT_UNVALIDATED"
    );
  }

  const captured = tokenStore.getState();
  if (!captured.token) {
    throw new AuthContextError(
      "Authenticated request has no bearer credential",
      "AUTH_CONTEXT_UNVALIDATED"
    );
  }
  if (captured.generation !== expectedGeneration) {
    throw new AuthContextError("Authentication context changed before request");
  }

  const assertCurrent = () => {
    const current = tokenStore.getState();
    if (current.generation !== captured.generation || current.token !== captured.token) {
      throw new AuthContextError("Authentication context changed during request");
    }
  };

  const awaitBound = async (operation) => {
    assertCurrent();
    try {
      const result = await operation();
      assertCurrent();
      return result;
    } catch (error) {
      // If both the network operation and credential context changed, the
      // auth boundary is the actionable failure and must dominate.
      assertCurrent();
      throw error;
    }
  };

  return {
    generation: captured.generation,
    authorization: `Bearer ${captured.token}`,
    assertCurrent,
    awaitBound,
  };
}

function createCloudApiRequestHandler() {
  return async function () {
    return {
      success: false,
      status: 0,
      code: "PERSONAL_EDITION",
      error: "Company services are not part of this build.",
    };
  };
}

module.exports = {
  AuthContextError,
  captureAuthFence,
  createCloudApiRequestHandler,
};
