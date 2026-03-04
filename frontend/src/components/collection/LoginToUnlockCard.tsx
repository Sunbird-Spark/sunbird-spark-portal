import { useAppI18n } from "@/hooks/useAppI18n";

const LoginToUnlockCard = () => {
  const { t } = useAppI18n();

  const handleLogin = () => {
    window.location.href = "/portal/login?prompt=none";
  };

  return (
    <div
      className="font-rubik w-full min-h-[8.75rem] rounded-[1.25rem] border border-sunbird-status-ongoing-border bg-sunbird-status-ongoing-bg p-5 flex flex-col"
      data-testid="login-to-unlock-card"
    >
      <div className="flex flex-col gap-3">
        <h3 className="font-rubik font-medium text-[1.125rem] leading-[100%] text-sunbird-status-ongoing-text">
          {t("courseDetails.unlockLearningTitle")}
        </h3>
        <p className="font-rubik font-normal text-[0.8125rem] leading-[100%] text-muted-foreground">
          {t("courseDetails.unlockLearningDescription")}
        </p>
      </div>
      <button
        type="button"
        onClick={handleLogin}
        className="font-rubik font-medium text-[1rem] leading-normal w-fit h-[2.25rem] px-5 rounded-[0.375rem] bg-sunbird-brick text-white hover:opacity-90 transition-opacity flex items-center justify-center self-start mt-[1.6875rem]"
      >
        {t("login")}
      </button>
    </div>
  );
};

export default LoginToUnlockCard;
