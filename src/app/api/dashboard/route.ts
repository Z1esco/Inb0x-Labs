import { failure, ok } from "@/lib/api-response";
import { dashboardQuerySchema } from "@/schemas/dashboard";
import { requireCurrentUser } from "@/server/auth/current-user";
import { getDashboard } from "@/server/dashboard/dashboard-service";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const input = dashboardQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return ok(await getDashboard(user, input.timezone), {
      demo: user.demo,
      externalCalls: false,
    });
  } catch (error) {
    return failure(error);
  }
}
