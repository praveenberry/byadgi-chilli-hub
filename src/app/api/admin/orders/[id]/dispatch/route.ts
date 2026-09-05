import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const methods = new Set([
  "DELHIVERY",
  "TRANSPORT",
]);

const statuses = new Set([
  "PENDING",
  "PACKED",
  "DISPATCHED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "EXCEPTION",
]);

function money2(value: number) {
  return Math.round(
    (value + Number.EPSILON) * 100
  ) / 100;
}

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await params;

    const body =
      await request.json();

    const dispatchMethod =
      String(
        body.dispatchMethod ?? ""
      );

    const shippingStatus =
      String(
        body.shippingStatus ??
          "PENDING"
      );

    if (
      !methods.has(
        dispatchMethod
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Dispatch must be DELHIVERY or TRANSPORT.",
        },
        { status: 400 }
      );
    }

    if (
      !statuses.has(
        shippingStatus
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid shipping status.",
        },
        { status: 400 }
      );
    }

    /*
     * Get courier charge.
     *
     * Default = ₹0
     */
    const courierChargeInput =
      Number(
        body.courierCharge ?? 0
      );

    if (
      !Number.isFinite(
        courierChargeInput
      ) ||
      courierChargeInput < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid courier charge.",
        },
        { status: 400 }
      );
    }

    /*
     * Maximum courier charge:
     * ₹10,000
     */
    if (
      courierChargeInput >
      10000
    ) {
      return NextResponse.json(
        {
          error:
            "Courier charge cannot exceed ₹10,000.",
        },
        { status: 400 }
      );
    }

    const courierCharge =
      money2(
        courierChargeInput
      );

    /*
     * Get current order.
     */
    const existingOrder =
      await prisma.order.findUnique(
        {
          where: { id },
          select: {
            total: true,
          },
        }
      );

    if (!existingOrder) {
      return NextResponse.json(
        {
          error:
            "Order not found.",
        },
        { status: 404 }
      );
    }

    const productTotal =
      Number(
        existingOrder.total
      );

    const grandTotal =
      money2(
        productTotal +
          courierCharge
      );

    const isDelhivery =
      dispatchMethod ===
      "DELHIVERY";

    const isTransport =
      dispatchMethod ===
      "TRANSPORT";

    const order =
      await prisma.order.update(
        {
          where: { id },

          data: {
            /*
             * Courier
             */
            courierCharge,

            grandTotal,

            /*
             * Dispatch
             */
            dispatchMethod:
              dispatchMethod as
                | "DELHIVERY"
                | "TRANSPORT",

            shippingStatus:
              shippingStatus as
                | "PENDING"
                | "PACKED"
                | "DISPATCHED"
                | "IN_TRANSIT"
                | "OUT_FOR_DELIVERY"
                | "DELIVERED"
                | "EXCEPTION",

            awbNumber:
              isDelhivery
                ? String(
                    body.awbNumber ??
                      ""
                  ).trim() ||
                  null
                : null,

            trackingUrl:
              isDelhivery
                ? String(
                    body.trackingUrl ??
                      ""
                  ).trim() ||
                  null
                : null,

            transportName:
              isTransport
                ? String(
                    body.transportName ??
                      ""
                  ).trim() ||
                  null
                : null,

            lrNumber:
              isTransport
                ? String(
                    body.lrNumber ??
                      ""
                  ).trim() ||
                  null
                : null,

            packageCount:
              body.packageCount
                ? Math.max(
                    1,
                    Number(
                      body.packageCount
                    )
                  )
                : null,

            totalWeight:
              body.totalWeight
                ? Number(
                    body.totalWeight
                  )
                : null,

            dispatchNotes:
              String(
                body.dispatchNotes ??
                  ""
              ).trim() ||
              null,

            dispatchDate:
              shippingStatus ===
                "DISPATCHED" ||
              shippingStatus ===
                "IN_TRANSIT" ||
              shippingStatus ===
                "OUT_FOR_DELIVERY" ||
              shippingStatus ===
                "DELIVERED"
                ? new Date()
                : undefined,

            deliveryDate:
              shippingStatus ===
              "DELIVERED"
                ? new Date()
                : undefined,

            status:
              shippingStatus ===
              "DELIVERED"
                ? "DELIVERED"
                : shippingStatus ===
                      "DISPATCHED" ||
                    shippingStatus ===
                      "IN_TRANSIT" ||
                    shippingStatus ===
                      "OUT_FOR_DELIVERY"
                  ? "SHIPPED"
                  : undefined,
          },
        }
      );

    return NextResponse.json({
      success: true,

      order: {
        ...order,

        total:
          order.total.toString(),

        courierCharge:
          order.courierCharge.toString(),

        grandTotal:
          order.grandTotal.toString(),
      },
    });
  } catch (error) {
    console.error(
      "PATCH dispatch",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to update dispatch details.",
      },
      { status: 500 }
    );
  }
}