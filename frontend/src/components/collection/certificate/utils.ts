import { userService } from "@/services/UserService";
import userAuthInfoService from "@/services/userAuthInfoService/userAuthInfoService";
import { ImagePickerState, NewTemplateForm } from "./types";

export const emptyImage = (): ImagePickerState => ({
  preview: null,
  artifactUrl: null,
  file: null,
});

export const emptyNewTemplate = (): NewTemplateForm => ({
  certTitle: "",
  name: "",
  logo1: emptyImage(),
  logo2: emptyImage(),
  sig1: emptyImage(),
  sig1Designation: "",
  sig2: emptyImage(),
  sig2Designation: "",
  termsAccepted: false,
});

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
