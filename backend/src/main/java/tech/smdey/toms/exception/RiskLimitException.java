package tech.smdey.toms.exception;

public class RiskLimitException extends RuntimeException {
    public RiskLimitException(String message) {
        super(message);
    }
}
