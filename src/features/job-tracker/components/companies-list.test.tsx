import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompaniesList } from "./companies-list";
import { renderWithIntl } from "@/test-utils/render-with-intl";

const mockDeleteCompany = jest.fn();
const mockDeleteManyCompanies = jest.fn();

jest.mock("nuqs", () => {
  const createParser = () => {
    const parser = {
      withOptions: () => parser,
      withDefault: () => parser,
    };
    return parser;
  };
  return {
    useQueryState: () => [null, jest.fn()],
    useQueryStates: () => [{}, jest.fn()],
    parseAsInteger: createParser(),
    parseAsString: createParser(),
    parseAsArrayOf: jest.fn(() => createParser()),
  };
});

jest.mock("nuqs/server", () => ({
  createParser: () => ({
    withOptions: () => ({}),
    withDefault: (val: unknown) => val,
  }),
}));

jest.mock("@/lib/parsers", () => ({
  getSortingStateParser: () => ({
    withOptions: () => ({
      withDefault: (val: unknown) => val,
    }),
  }),
}));

const mockCompanies = [
  {
    id: "co-1",
    name: "Acme Corp",
    email: "jobs@acme.com",
    website: "https://acme.com",
    linkedinUrl: "",
    location: "Remote",
    description: "Tech company",
    applicationsCount: 2,
  },
  {
    id: "co-2",
    name: "Beta Studio",
    email: "contact@beta.com",
    website: "",
    linkedinUrl: "",
    location: "Madrid",
    description: "",
    applicationsCount: 0,
  },
];

jest.mock("@/trpc/react", () => ({
  api: {
    useUtils: () => ({
      jobTrackerAdmin: {
        getCompanies: {
          invalidate: jest.fn(),
        },
        getDashboardStats: {
          invalidate: jest.fn(),
        },
      },
    }),
    jobTrackerAdmin: {
      getCompanies: {
        useQuery: () => ({
          data: {
            data: mockCompanies,
            pageCount: 1,
            totalCount: 2,
          },
          isFetching: false,
        }),
      },
      deleteCompany: {
        useMutation: () => ({
          mutateAsync: mockDeleteCompany,
          isPending: false,
        }),
      },
      deleteManyCompanies: {
        useMutation: () => ({
          mutateAsync: mockDeleteManyCompanies,
          isPending: false,
        }),
      },
    },
  },
}));

describe("CompaniesList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders companies list with names and application count subtitle", () => {
    renderWithIntl(
      <CompaniesList
        initialCompanies={mockCompanies}
        pageCount={1}
        totalCount={2}
      />,
    );

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(
      screen.getByText(/2 (applications|postulaciones)/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Beta Studio")).toBeInTheDocument();
    expect(screen.getByText("Madrid")).toBeInTheDocument();
  });

  it("prevents deleting a company with active applications", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <CompaniesList
        initialCompanies={mockCompanies}
        pageCount={1}
        totalCount={2}
      />,
    );

    const deleteButtons = screen.getAllByRole("button", {
      name: /delete|eliminar/i,
    });
    // First delete button corresponds to Acme Corp (which has 2 applications)
    await user.click(deleteButtons[0]);

    // Should display dialog stating it cannot be deleted
    expect(
      screen.getByText(/cannot delete|no se puede eliminar/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/2 (applications|postulaciones)/i),
    ).toBeInTheDocument();

    expect(mockDeleteCompany).not.toHaveBeenCalled();
  });

  it("allows deleting a company with 0 applications after confirmation", async () => {
    const user = userEvent.setup();
    mockDeleteCompany.mockResolvedValueOnce({ id: "co-2" });

    renderWithIntl(
      <CompaniesList
        initialCompanies={mockCompanies}
        pageCount={1}
        totalCount={2}
      />,
    );

    const deleteButtons = screen.getAllByRole("button", {
      name: /delete|eliminar/i,
    });
    // Second delete button corresponds to Beta Studio (0 applications)
    await user.click(deleteButtons[1]);

    expect(
      screen.getByText(/delete company\?|¿eliminar empresa\?/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/will be removed|se eliminará/i),
    ).toBeInTheDocument();

    const confirmButton = screen.getByRole("button", {
      name: /^(delete|eliminar)$/i,
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteCompany).toHaveBeenCalledWith({ id: "co-2" });
    });
  });
});
