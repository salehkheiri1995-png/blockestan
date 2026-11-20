package ir.blockestan.game;

/**
 * Cafe Bazaar (Poolakey) billing configuration for Blockestan.
 *
 * The RSA public key below is the developer public key from the Cafe Bazaar console. Poolakey
 * verifies every purchase signature locally against this key, so a purchase callback only fires
 * for a genuine, verified purchase.
 */
final class BazaarConfig {

    /** Developer RSA public key (کافه‌بازار). */
    static final String RSA_PUBLIC_KEY =
            "MIHNMA0GCSqGSIb3DQEBAQUAA4G7ADCBtwKBrwCyKReQppJUsoA9VgkeiOrUoFM/zfutWv0wTalL0nxKlh0q0P7tAUY2ZFix0Aaym+dcrxrpa9r2BH0OfQvlirgvwLS6kDYN42RPfMbqeqFsxQLDvgrgJoxmq3qEaTdWXBPQGK9JyNKtZvB01LDlvggliHsUuUJI0kBeTHd6mOSJpB8z1XnQ1iqzHhUrqJ92pe19kQXiV9eev64Cv8uNIUBVhcmYITrbz1tr/RAXwTkCAwEAAQ==";

    private BazaarConfig() {}
}
