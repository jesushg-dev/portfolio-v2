import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import {
  FormRoot,
  FormContent,
  FormError,
  FormSection,
  FormValidationStatus,
  AnimatedVisibility,
  FormItem,
  FormCheckboxItem,
  FormSwitchItem,
  FormActions,
} from "./form-root";

const FormWrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm();
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe("FormRoot", () => {
  it("renders children and handles onSubmit", () => {
    const handleSubmit = jest.fn((e: React.FormEvent) => {
      e.preventDefault();
    });
    const { container } = render(
      <FormRoot onSubmit={handleSubmit}>
        <input name="test" />
      </FormRoot>
    );

    const form = container.querySelector("form");
    expect(form).toBeInTheDocument();
    if (form) fireEvent.submit(form);
    expect(handleSubmit).toHaveBeenCalled();
  });

  it("renders without onSubmit", () => {
    const { container } = render(<FormRoot><input /></FormRoot>);
    expect(container.querySelector("form")).toBeInTheDocument();
  });
});

describe("FormContent & FormError", () => {
  it("renders children and handles error", () => {
    render(
      <FormContent error={{ message: "Validation error" }}>
        <span>Field content</span>
      </FormContent>
    );

    expect(screen.getByText("Field content")).toBeInTheDocument();
  });

  it("FormError returns null for falsy or non-object error", () => {
    const { container: c1 } = render(<FormError error={undefined} />);
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(<FormError error="plain string error" />);
    expect(c2.firstChild).toBeNull();
  });
});

describe("FormSection", () => {
  it("renders title, description, and children", () => {
    render(
      <FormSection title="Account Info" description="Enter your credentials">
        <input name="username" />
      </FormSection>
    );

    expect(screen.getByText("Account Info")).toBeInTheDocument();
    expect(screen.getByText("Enter your credentials")).toBeInTheDocument();
  });

  it("renders without title and description", () => {
    const { container } = render(
      <FormSection>
        <input name="username" />
      </FormSection>
    );
    expect(container.querySelector("fieldset")).toBeInTheDocument();
  });
});

describe("FormValidationStatus", () => {
  it("renders valid status when isValid is true", () => {
    render(
      <FormValidationStatus isValid={true} validText="Valid email" invalidText="Invalid email" />
    );
    expect(screen.getByText("Valid email")).toBeInTheDocument();
  });

  it("renders invalid status when isValid is false", () => {
    render(
      <FormValidationStatus isValid={false} validText="Valid email" invalidText="Invalid email" />
    );
    expect(screen.getByText("Invalid email")).toBeInTheDocument();
  });
});

describe("AnimatedVisibility", () => {
  it("renders content when isVisible is true", () => {
    render(
      <AnimatedVisibility isVisible={true}>
        <div>Visible content</div>
      </AnimatedVisibility>
    );
    expect(screen.getByText("Visible content")).toBeInTheDocument();
  });

  it("does not render content when isVisible is false", () => {
    render(
      <AnimatedVisibility isVisible={false}>
        <div>Hidden content</div>
      </AnimatedVisibility>
    );
    expect(screen.queryByText("Hidden content")).toBeNull();
  });
});

describe("FormItem", () => {
  it("renders label, required asterisk, description, and input inside FormProvider", () => {
    render(
      <FormWrapper>
        <FormItem label="Email" description="We never share your email" required={true}>
          <input name="email" />
        </FormItem>
      </FormWrapper>
    );

    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByText("We never share your email")).toBeInTheDocument();
  });
});

describe("FormCheckboxItem", () => {
  it("renders label and description for checkbox", () => {
    render(
      <FormWrapper>
        <FormCheckboxItem label="Accept Terms" description="Read terms first">
          <input type="checkbox" />
        </FormCheckboxItem>
      </FormWrapper>
    );

    expect(screen.getByText("Accept Terms")).toBeInTheDocument();
    expect(screen.getByText("Read terms first")).toBeInTheDocument();
  });
});

describe("FormSwitchItem", () => {
  it("renders switch label, icon, and description", () => {
    render(
      <FormWrapper>
        <FormSwitchItem
          label="Enable Notifications"
          description="Get push updates"
          icon={<span data-testid="switch-icon">🔔</span>}
          tooltip="Toggle on/off"
        >
          <input type="checkbox" />
        </FormSwitchItem>
      </FormWrapper>
    );

    expect(screen.getByText("Enable Notifications")).toBeInTheDocument();
    expect(screen.getByTestId("switch-icon")).toBeInTheDocument();
    expect(screen.getByText("Get push updates")).toBeInTheDocument();
  });
});

describe("FormActions", () => {
  it("renders submit button with default title", () => {
    render(<FormActions />);
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
  });

  it("renders custom title, children, and calls onClick when clicked", () => {
    const handleClick = jest.fn();
    render(
      <FormActions title="Save Changes" onClick={handleClick}>
        <button type="button">Cancel</button>
      </FormActions>
    );

    expect(screen.getByText("Cancel")).toBeInTheDocument();
    const saveBtn = screen.getByRole("button", { name: /Save Changes/ });
    fireEvent.click(saveBtn);
    expect(handleClick).toHaveBeenCalled();
  });

  it("disables button when isPending is true", () => {
    render(<FormActions title="Save Changes" isPending={true} />);
    const saveBtn = screen.getByRole("button", { name: /Save Changes/ });
    expect(saveBtn).toBeDisabled();
  });
});
