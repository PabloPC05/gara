import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthDialog } from "@/components/auth/AuthDialog";

const authState = {
	user: null,
	loading: false,
	error: null,
	signIn: vi.fn(),
	signUp: vi.fn(),
	resetPassword: vi.fn(),
	clearError: vi.fn(),
};

vi.mock("@/stores/useAuthStore", () => ({
	useAuthStore: (selector) => selector(authState),
	__esModule: true,
}));

function renderDialog(props = {}) {
	const onOpenChange = vi.fn();
	const result = render(
		<AuthDialog open={true} onOpenChange={onOpenChange} {...props} />,
	);
	return { ...result, onOpenChange };
}

describe("AuthDialog", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		authState.user = null;
		authState.loading = false;
		authState.error = null;
		authState.signIn.mockImplementation(async () => {});
		authState.signUp.mockImplementation(async () => {});
		authState.resetPassword.mockImplementation(async () => {});
		authState.clearError.mockImplementation(() => {});
	});

	it("renders login mode by default", () => {
		renderDialog();
		expect(screen.getByText("Iniciar sesión")).toBeInTheDocument();
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
	});

	it("switches to signup mode", async () => {
		const user = userEvent.setup();
		renderDialog();

		await user.click(screen.getByText(/no tienes cuenta/i));

		expect(screen.getByText("Registrarse")).toBeInTheDocument();
	});

	it("switches to recovery mode", async () => {
		const user = userEvent.setup();
		renderDialog();

		await user.click(screen.getByText(/olvidaste la clave/i));

		expect(screen.getByText("Recuperar acceso")).toBeInTheDocument();
		expect(screen.queryByLabelText(/contraseña/i)).not.toBeInTheDocument();
	});

	it("shows error message when error exists", () => {
		authState.error = "Invalid credentials";
		renderDialog();

		expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
	});

	it("calls signIn on login submit", async () => {
		const user = userEvent.setup();
		renderDialog();

		await user.type(screen.getByLabelText(/email/i), "test@test.com");
		await user.type(screen.getByLabelText(/contraseña/i), "123456");
		await user.click(screen.getByRole("button", { name: /entrar/i }));

		expect(authState.signIn).toHaveBeenCalledWith("test@test.com", "123456");
	});

	it("calls signUp on signup submit", async () => {
		const user = userEvent.setup();
		renderDialog();

		await user.click(screen.getByText(/no tienes cuenta/i));
		await user.type(screen.getByLabelText(/email/i), "new@test.com");
		await user.type(screen.getByLabelText(/contraseña/i), "123456");
		await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

		expect(authState.signUp).toHaveBeenCalledWith("new@test.com", "123456");
	});

	it("calls resetPassword on recovery submit", async () => {
		const user = userEvent.setup();
		renderDialog();

		await user.click(screen.getByText(/olvidaste la clave/i));
		await user.type(screen.getByLabelText(/email/i), "reset@test.com");
		await user.click(screen.getByRole("button", { name: /recuperar clave/i }));

		expect(authState.resetPassword).toHaveBeenCalledWith("reset@test.com");
	});

	it("disables submit button when loading", () => {
		authState.loading = true;
		renderDialog();

		const submitBtn = screen.getByRole("button", { name: "" });
		expect(submitBtn).toBeDisabled();
		expect(submitBtn.type).toBe("submit");
	});

	it("calls onOpenChange(false) when user becomes authenticated", async () => {
		const onOpenChange = vi.fn();
		const { rerender } = render(
			<AuthDialog open={true} onOpenChange={onOpenChange} />,
		);

		authState.user = { email: "test@test.com" };
		rerender(<AuthDialog open={true} onOpenChange={onOpenChange} />);

		await waitFor(() => {
			expect(onOpenChange).toHaveBeenCalledWith(false);
		});
	});

	it("clears error when dialog closes", async () => {
		const user = userEvent.setup();
		authState.error = "some error";
		renderDialog();

		const closeBtn = screen.getByRole("button", { name: /close/i });
		await user.click(closeBtn);

		expect(authState.clearError).toHaveBeenCalled();
	});
});
