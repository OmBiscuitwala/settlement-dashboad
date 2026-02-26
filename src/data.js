export const merchants = [
  {
    id: "M001",
    name: "Merchant ABC Store",
    bank: "****7890",
    flagged: false,
    bankMismatch: false,
    transactions: [
      { id: 1, amount: 5000, fee: 200, refund: 0 },
      { id: 2, amount: 3000, fee: 150, refund: 100 }
    ]
  },
  {
    id: "M002",
    name: "Merchant XYZ Mart",
    bank: "****4567",
    flagged: true,
    bankMismatch: true,
    transactions: [
      { id: 1, amount: 150000, fee: 5000, refund: 0 }
    ]
  }
];
