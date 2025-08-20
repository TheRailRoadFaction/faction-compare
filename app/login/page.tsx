import { LoginForm } from "@/components/login-form";
import { NavigateFunction, useNavigate } from "react-router-dom";

export class LoginData {
  navigate: NavigateFunction;
  constructor(navigate: NavigateFunction) {
    this.navigate = navigate;
  }

  handleSubmit = (data: { ffscouterKey: string; publicKey: string }) => {
    console.log(data.ffscouterKey);
    console.log(data.publicKey);

    localStorage.setItem("keys", JSON.stringify(data));

    this.navigate("/");
  };

  getKeys = (): { ffscouterKey: string; publicKey: string } | null => {
    const v = localStorage.getItem("keys");
    if (v == null) {
      return v;
    }
    try {
      const j = JSON.parse(v);
      if (j.ffscouterKey && j.publicKey) {
        return j;
      }
    } catch (e) {
      console.log("Error parsing stored keys:", e);
      localStorage.removeItem("keys");
      return null;
    }

    return null;
  };
}

export default function Page() {
  const navigate = useNavigate();
  const login_data = new LoginData(navigate);

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm formSubmit={login_data.handleSubmit} />
      </div>
    </div>
  );
}
