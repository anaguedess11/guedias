import { formatPrice } from "@/lib/format";
import { PAYMENT_METHOD_LABEL, formatIban, paymentDetails, type PaymentMethod } from "@/lib/payment-details";

export function PaymentInstructions({
  paymentMethod,
  totalCents,
  orderId,
}: {
  paymentMethod: PaymentMethod;
  totalCents: number;
  orderId: string;
}) {
  const amount = formatPrice(totalCents / 100);

  return (
    <>
      <h2 className="text-sm font-semibold text-stone-900">
        Como pagar por {paymentMethod === "mbway" ? PAYMENT_METHOD_LABEL.mbway : "transferência bancária"}
      </h2>
      {paymentMethod === "mbway" ? (
        <p className="mt-2 text-sm leading-relaxed text-stone-900/65">
          Envia <strong>{amount}</strong> para o número{" "}
          <strong>{paymentDetails.mbwayPhone || "(a confirmar — contacta-nos)"}</strong> via MB WAY.
        </p>
      ) : (
        <div className="mt-2 space-y-1 text-sm leading-relaxed text-stone-900/65">
          {paymentDetails.bankHolder && (
            <p>
              Titular: <strong>{paymentDetails.bankHolder}</strong>
            </p>
          )}
          <p>
            IBAN:{" "}
            <strong className="whitespace-nowrap">
              {paymentDetails.bankIban ? formatIban(paymentDetails.bankIban) : "(a confirmar — contacta-nos)"}
            </strong>
          </p>
          {paymentDetails.bankName && <p>Banco: {paymentDetails.bankName}</p>}
          <p>
            Valor: <strong>{amount}</strong>
          </p>
          <p>Descrição: indica #{orderId.slice(0, 8)} para identificarmos o pagamento.</p>
        </div>
      )}
    </>
  );
}
