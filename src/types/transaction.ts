export interface TransactionEstimate {
    // Estimated CPU usage for transaction (false = failed to estimate)
    cpu: number | boolean,
    // Estimated NET usage for transaction (false = failed to estimate)
    net: number | boolean,
    // Error generated during transaction estimation
    error?: any
}
