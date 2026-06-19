package tech.smdey.toms.exception;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status, String message, String error) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", status.value());
        body.put("message", message);
        body.put("error", error);
        body.put("timestamp", LocalDateTime.now().toString());
        return new ResponseEntity<>(body, status);
    }

    @ExceptionHandler(SymbolNotAllowedException.class)
    public ResponseEntity<Map<String, Object>> handleSymbolNotAllowed(SymbolNotAllowedException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), "Symbol not allowed");
    }

    @ExceptionHandler(OrderNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleOrderNotFound(OrderNotFoundException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), "Order not found");
    }

    @ExceptionHandler(RiskLimitException.class)
    public ResponseEntity<Map<String, Object>> handleRiskLimit(RiskLimitException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), "Risk limit exceeded");
    }

    @ExceptionHandler(OrderConstraintException.class)
    public ResponseEntity<Map<String, Object>> handleOrderConstraint(OrderConstraintException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), "Order constraint violated");
    }

    @ExceptionHandler(OrderNotModifiableException.class)
    public ResponseEntity<Map<String, Object>> handleOrderNotModifiable(OrderNotModifiableException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), "Order cannot be modified");
    }

}
