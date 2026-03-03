import userAuthInfoService from "@/services/userAuthInfoService/userAuthInfoService";
import { userService } from "@/services/UserService";

export async function resolveUserAndOrg() {
  let userId = userAuthInfoService.getUserId();
  if (!userId) {
    const authInfo = await userAuthInfoService.getAuthInfo();
    userId = authInfo?.uid ?? null;
  }
  if (!userId) throw new Error("User not authenticated");

  const userResponse = await userService.userRead(userId);
  const userObj = userResponse.data.response as Record<string, unknown>;
  const rootOrgId = (userObj.rootOrgId as string | undefined) ?? "";
  const firstName = (userObj.firstName as string | undefined) ?? "";
  const lastName  = (userObj.lastName  as string | undefined) ?? "";
  const userName  = [firstName, lastName].filter(Boolean).join(" ") || userId;

  return { userId, rootOrgId, userName };
}
