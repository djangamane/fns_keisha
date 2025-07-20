const { apiRequest, apiResponse, apiError } = require('../utils/logger');

/**
 * Request logging middleware
 * Logs all incoming requests and their responses with timing information
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  
  // Log the incoming request
  apiRequest(req);

  // Store original res.end to capture response
  const originalEnd = res.end;
  
  res.end = function(chunk, encoding) {
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Log the response
    apiResponse(req, res, responseTime);
    
    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  // Handle errors in the request pipeline
  const originalNext = next;
  next = function(error) {
    if (error) {
      apiError(req, error);
    }
    originalNext(error);
  };

  next();
}

module.exports = requestLogger;