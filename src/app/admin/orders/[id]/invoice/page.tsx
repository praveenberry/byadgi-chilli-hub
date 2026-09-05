import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PrintButton from "./PrintButton";

const GST_RATE = 5;

function money(value: number) {
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function round2(value: number) {
  return Math.round(
    (value + Number.EPSILON) * 100
  ) / 100;
}

function numberToWords(amount: number) {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function under1000(n: number): string {
    let result = "";

    if (n >= 100) {
      result +=
        ones[Math.floor(n / 100)] +
        " Hundred ";
      n %= 100;
    }

    if (n >= 20) {
      result +=
        tens[Math.floor(n / 10)] +
        " ";
      n %= 10;
    }

    if (n > 0) {
      result += ones[n] + " ";
    }

    return result.trim();
  }

  if (amount === 0) {
    return "Zero Rupees Only";
  }

  let n = Math.floor(amount);

  const paise = Math.round(
    (amount - n) * 100
  );

  let result = "";

  if (n >= 10000000) {
    result +=
      under1000(
        Math.floor(n / 10000000)
      ) +
      " Crore ";
    n %= 10000000;
  }

  if (n >= 100000) {
    result +=
      under1000(
        Math.floor(n / 100000)
      ) +
      " Lakh ";
    n %= 100000;
  }

  if (n >= 1000) {
    result +=
      under1000(
        Math.floor(n / 1000)
      ) +
      " Thousand ";
    n %= 1000;
  }

  if (n > 0) {
    result += under1000(n);
  }

  result += " Rupees";

  if (paise > 0) {
    result +=
      ` and ${under1000(
        paise
      )} Paise`;
  }

  return result.trim() + " Only";
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order =
    await prisma.order.findUnique({
      where: {
        id,
      },
      include: {
        items: true,
      },
    });

  if (!order || !order.invoiceNumber) {
    notFound();
  }

  /*
   * OPTION B
   *
   * Order total already includes GST.
   *
   * Example:
   * Final price = ₹750
   *
   * Taxable value = ₹714.29
   * GST = ₹35.71
   * Final total = ₹750.00
   */

  const grandTotal = round2(
    Number(order.total)
  );

  const isKarnataka =
    (order.shippingState || "")
      .trim()
      .toLowerCase() ===
    "karnataka";

  const taxableValue =
    round2(
      grandTotal /
        (1 + GST_RATE / 100)
    );

  const gst =
    round2(
      grandTotal -
        taxableValue
    );

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isKarnataka) {
    cgst = round2(gst / 2);

    /*
     * Make sure CGST + SGST
     * exactly equals GST.
     */
    sgst = round2(
      gst - cgst
    );
  } else {
    igst = gst;
  }

  return (
    <>
      <style>{`
        @page {
          size: A4;
          margin: 12mm;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #eee;
          font-family: Arial, Helvetica, sans-serif;
          color: #111;
        }

        .invoice {
          width: 210mm;
          min-height: 297mm;
          margin: 20px auto;
          background: white;
          padding: 12mm;
        }

        .header {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #111;
          padding-bottom: 14px;
        }

        .business-name {
          font-size: 25px;
          font-weight: 800;
        }

        .small {
          font-size: 12px;
          line-height: 1.5;
        }

        .invoice-title {
          font-size: 24px;
          font-weight: 800;
          text-align: right;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-top: 18px;
        }

        .box {
          border: 1px solid #999;
          padding: 10px;
        }

        .box-title {
          font-weight: 700;
          margin-bottom: 6px;
          text-transform: uppercase;
          font-size: 12px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 18px;
          font-size: 12px;
        }

        th,
        td {
          border: 1px solid #888;
          padding: 7px;
        }

        th {
          background: #f2f2f2;
        }

        .right {
          text-align: right;
        }

        .center {
          text-align: center;
        }

        .summary {
          margin-left: auto;
          width: 45%;
          margin-top: 15px;
        }

        .summary td {
          padding: 7px;
        }

        .grand-total {
          font-size: 15px;
          font-weight: 800;
        }

        .amount-words {
          margin-top: 18px;
          border: 1px solid #999;
          padding: 10px;
          font-size: 12px;
        }

        .dispatch {
          margin-top: 18px;
          border: 1px solid #999;
          padding: 10px;
          font-size: 12px;
        }

        .footer {
          display: flex;
          justify-content: space-between;
          margin-top: 55px;
        }

        .signature {
          width: 220px;
          text-align: center;
          padding-top: 45px;
          border-top: 1px solid #555;
        }

        .print-button {
          position: fixed;
          top: 15px;
          right: 15px;
          padding: 10px 18px;
          border: 0;
          border-radius: 6px;
          background: #111;
          color: white;
          cursor: pointer;
          font-weight: 700;
        }

        @media print {
          body {
            background: white;
          }

          .invoice {
            margin: 0;
            width: 100%;
            min-height: auto;
            padding: 0;
          }

          .print-button {
            display: none;
          }
        }
      `}</style>

      <PrintButton />

      <main className="invoice">

        {/* HEADER */}
        <header className="header">
          <div>
            <div className="business-name">
              BYADGI CHILLI HUB
            </div>

            <div className="small">
              APMC YARD BYADGI
              <br />
              Karnataka - 29
              <br />
              Mobile: 7019848055
              <br />
              Email:
              info@byadgichillihub.com
            </div>
          </div>

          <div>
            <div className="invoice-title">
              TAX INVOICE
            </div>

            <div className="small">
              <b>Invoice No:</b>{" "}
              {order.invoiceNumber}
              <br />

              <b>Invoice Date:</b>{" "}
              {order.invoiceDate
                ? new Date(
                    order.invoiceDate
                  ).toLocaleDateString(
                    "en-IN"
                  )
                : "-"}
              <br />

              <b>Order No:</b>{" "}
              {order.orderNumber}
            </div>
          </div>
        </header>

        {/* CUSTOMER / SUPPLIER */}
        <div className="info-grid">

          <div className="box">
            <div className="box-title">
              Bill To
            </div>

            <div>
              <b>
                {order.customerName ||
                  "Customer"}
              </b>
            </div>

            <div className="small">
              Mobile:{" "}
              {order.customerMobile ||
                "-"}

              <br />

              {order.shippingAddress1 && (
                <>
                  {
                    order.shippingAddress1
                  }
                  <br />
                </>
              )}

              {order.shippingAddress2 && (
                <>
                  {
                    order.shippingAddress2
                  }
                  <br />
                </>
              )}

              {order.shippingCity},{" "}
              {order.shippingState}
              <br />

              PIN:{" "}
              {order.shippingPincode ||
                "-"}
            </div>
          </div>

          <div className="box">
            <div className="box-title">
              Supplier
            </div>

            <b>
              Byadgi Chilli Hub
            </b>

            <div className="small">
              APMC YARD BYADGI
              <br />
              Karnataka - 29
              <br />
              GSTIN: __________________
            </div>
          </div>

        </div>

        {/* PRODUCTS */}
        <table>
          <thead>
            <tr>
              <th className="center">
                #
              </th>

              <th>
                Product / Brand
              </th>

              <th>
                Pack Size
              </th>

              <th className="center">
                Qty
              </th>

              <th className="right">
                Unit Price
              </th>

              <th className="right">
                Taxable Value
              </th>
            </tr>
          </thead>

          <tbody>
            {order.items.map(
              (item, index) => {
                const value =
                  Number(
                    item.unitPrice
                  ) *
                  item.quantity;

                /*
                 * Unit price already includes GST.
                 * Show taxable portion here.
                 */
                const taxableItemValue =
                  round2(
                    value /
                      (1 +
                        GST_RATE /
                          100)
                  );

                return (
                  <tr
                    key={item.id}
                  >
                    <td className="center">
                      {index + 1}
                    </td>

                    <td>
                      <b>
                        {
                          item.productName
                        }
                      </b>
                      <br />
                      {
                        item.brandName
                      }
                    </td>

                    <td>
                      {
                        item.packSizeLabel
                      }
                    </td>

                    <td className="center">
                      {item.quantity}
                    </td>

                    <td className="right">
                      {money(
                        Number(
                          item.unitPrice
                        )
                      )}
                    </td>

                    <td className="right">
                      {money(
                        taxableItemValue
                      )}
                    </td>
                  </tr>
                );
              }
            )}
          </tbody>
        </table>

        {/* SUMMARY */}
        <table className="summary">
          <tbody>

            <tr>
              <td>
                Taxable Value
              </td>

              <td className="right">
                {money(
                  taxableValue
                )}
              </td>
            </tr>

            {isKarnataka ? (
              <>
                <tr>
                  <td>
                    CGST @ 2.5%
                  </td>

                  <td className="right">
                    {money(cgst)}
                  </td>
                </tr>

                <tr>
                  <td>
                    SGST @ 2.5%
                  </td>

                  <td className="right">
                    {money(sgst)}
                  </td>
                </tr>
              </>
            ) : (
              <tr>
                <td>
                  IGST @ 5%
                </td>

                <td className="right">
                  {money(igst)}
                </td>
              </tr>
            )}

            <tr className="grand-total">
              <td>
                Grand Total
              </td>

              <td className="right">
                {money(grandTotal)}
              </td>
            </tr>

          </tbody>
        </table>

        {/* AMOUNT WORDS */}
        <div className="amount-words">
          <b>
            Amount in Words:
          </b>{" "}
          {numberToWords(
            grandTotal
          )}
        </div>

        {/* DISPATCH */}
        <div className="dispatch">
          <b>
            Dispatch Details
          </b>

          <br />

          {order.dispatchMethod ===
          "DELHIVERY" ? (
            <>
              Courier:{" "}
              <b>
                Delhivery
              </b>
              <br />

              AWB:{" "}
              {order.awbNumber ||
                "Not assigned"}
              <br />

              Tracking:{" "}
              {order.trackingUrl ||
                "Not assigned"}
            </>
          ) : order.dispatchMethod ===
            "TRANSPORT" ? (
            <>
              Transport:{" "}
              <b>
                {order.transportName ||
                  "Not assigned"}
              </b>

              <br />

              LR Number:{" "}
              {order.lrNumber ||
                "Not assigned"}
            </>
          ) : (
            "Dispatch details not assigned yet."
          )}

          {order.packageCount && (
            <>
              <br />
              Packages:{" "}
              {order.packageCount}
            </>
          )}

          {order.totalWeight && (
            <>
              <br />
              Weight:{" "}
              {order.totalWeight.toString()}{" "}
              kg
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="footer">

          <div className="small">
            <b>
              Terms & Conditions
            </b>

            <br />

            Goods once sold are subject
            to applicable business terms.

            <br />

            Please verify goods at the
            time of delivery.
          </div>

          <div className="signature">
            Authorized Signatory

            <br />

            <b>
              Byadgi Chilli Hub
            </b>
          </div>

        </div>

      </main>
    </>
  );
}