import { auditMerchantBill } from "./billSettlementAuditor";

describe("auditMerchantBill", () => {
  test("extracts high-priority printed total and updates outstanding amount", () => {
    const result = auditMerchantBill({
      merchant_id: "M-8829",
      previous_outstanding_amount: 1000,
      bill_text: `Subtotal: $140.00\nTax: $10.00\nTotal Amount Due: $150.00`,
    });

    expect(result).toEqual({
      merchant_id: "M-8829",
      extracted_bill_total: 150,
      previous_outstanding_amount: 1000,
      new_outstanding_total: 1150,
      confidence_score: 0.96,
      is_verification_passed: true,
      reasoning: 'Printed line: "Total Amount Due: $150.00"',
    });
  });

  test("prioritizes handwritten circled override", () => {
    const result = auditMerchantBill({
      merchant_id: "M-9001",
      previous_outstanding_amount: 250,
      bill_text: `Grand Total: INR 1,200.00`,
      handwritten_values: [
        {
          value: 1180,
          is_circled: true,
          confidence: 0.95,
        },
      ],
    });

    expect(result.extracted_bill_total).toBe(1180);
    expect(result.new_outstanding_total).toBe(1430);
    expect(result.is_verification_passed).toBe(true);
    expect(result.reasoning).toContain("Handwritten circled override");
  });

  test("fails verification when image is blurry", () => {
    const result = auditMerchantBill({
      merchant_id: "M-9010",
      previous_outstanding_amount: 500,
      bill_text: "Total: 700",
      is_image_blurry: true,
    });

    expect(result.is_verification_passed).toBe(false);
    expect(result.extracted_bill_total).toBe(0);
    expect(result.new_outstanding_total).toBe(500);
  });
});
