export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// 使用自建登入系統（電話 + 密碼），永遠指向本地 /login 頁面
export const getLoginUrl = (_returnPath?: string) => {
  return "/login";
};
