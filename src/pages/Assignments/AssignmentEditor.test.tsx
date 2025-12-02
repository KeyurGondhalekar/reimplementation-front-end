import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import AssignmentEditor from './AssignmentEditor';
import alertReducer from '../../store/slices/alertSlice';
import authReducer from '../../store/slices/authenticationSlice';

// Mock dependencies
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useLoaderData: () => ({ name: 'Test Assignment', id: 1 }),
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: { from: '/assignments' } }),
}));

// Mock useAPI - returns different data for each call
// The component calls useAPI() three times:
// 1. For assignment response (expects data with status property)
// 2. For courses response (expects data with status and data array)
// 3. For calibration submissions response (expects data with status and data array)
// Create stable instances that will be reused across renders
const mockUseAPIInstance1 = {
    data: undefined, // Start with undefined to prevent immediate useEffect triggers
    setData: jest.fn(),
    isLoading: false,
    error: "",
    sendRequest: jest.fn(),
};

const mockUseAPIInstance2 = {
    data: undefined,
    setData: jest.fn(),
    isLoading: false,
    error: "",
    sendRequest: jest.fn(),
};

const mockUseAPIInstance3 = {
    data: undefined,
    setData: jest.fn(),
    isLoading: false,
    error: "",
    sendRequest: jest.fn(),
};

let mockUseAPICallOrder = 0;
jest.mock('hooks/useAPI', () => {
    // useAPI is a default export function that returns { data, setData, isLoading, error, sendRequest }
    return () => {
        // Track call order and reset after every 3 calls (one render cycle)
        const currentCall = mockUseAPICallOrder % 3;
        mockUseAPICallOrder++;

        // Reset counter after every 3 calls to ensure consistent returns across renders
        if (mockUseAPICallOrder >= 3) {
            mockUseAPICallOrder = 0;
        }

        // Return the appropriate instance based on call order
        if (currentCall === 0) {
            return mockUseAPIInstance1;
        } else if (currentCall === 1) {
            return mockUseAPIInstance2;
        } else {
            return mockUseAPIInstance3;
        }
    };
});

jest.mock('components/Form/FormInput', () => ({
    __esModule: true,
    default: ({ name, label, type }: any) => (
        <input
            data-testid={`input-${name}`}
            placeholder={label}
            type={type || 'text'}
            name={name}
        />
    ),
}));

jest.mock('components/Form/FormSelect', () => ({
    __esModule: true,
    default: ({ name, options, controlId }: any) => (
        <select data-testid={`select-${name}`} data-controlid={controlId}>
            {options?.map((opt: any) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    ),
}));

jest.mock('components/Form/FormCheckBox', () => ({
    __esModule: true,
    default: ({ name, label, controlId }: any) => (
        <input
            type="checkbox"
            data-testid={`checkbox-${name}`}
            aria-label={label}
            data-controlid={controlId}
            name={name}
        />
    ),
}));

jest.mock('components/Form/FormDatePicker', () => ({
    __esModule: true,
    default: ({ controlId, name }: any) => (
        <input
            type="date"
            data-testid={`datepicker-${name}`}
            data-controlid={controlId}
            name={name}
        />
    ),
}));

jest.mock('components/Table/Table', () => ({
    __esModule: true,
    default: ({ data, columns }: any) => (
        <div data-testid="table">
            <div data-testid="table-data-count">{data?.length || 0}</div>
            {data?.map((row: any, idx: number) => (
                <div key={idx} data-testid={`table-row-${idx}`}>
                    {columns?.map((col: any, colIdx: number) => (
                        <div key={colIdx} data-testid={`table-cell-${idx}-${colIdx}`}>
                            {col.cell ? col.cell({ row: { original: row } }) : row[col.accessorKey]}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    ),
}));

jest.mock('components/ToolTip', () => ({
    __esModule: true,
    default: ({ id, info }: any) => <span data-testid={`tooltip-${id}`} title={info} />,
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
    FontAwesomeIcon: ({ icon }: any) => <span data-testid="font-awesome-icon">{icon?.iconName || 'icon'}</span>,
}));

jest.mock('react-bootstrap', () => ({
    Button: ({ children, onClick, variant, size, ...props }: any) => (
        <button onClick={onClick} data-variant={variant} data-size={size} {...props}>
            {children}
        </button>
    ),
    Modal: ({ children, show, onHide, ...props }: any) => (
        show ? <div data-testid="modal" {...props}>{children}</div> : null
    ),
    Tabs: ({ children, activeKey, onSelect, ...props }: any) => (
        <div data-testid="tabs" data-active-key={activeKey} {...props}>{children}</div>
    ),
    Tab: ({ children, eventKey, title, ...props }: any) => (
        <div data-testid={`tab-${eventKey}`} data-event-key={eventKey} {...props}>
            {title && <span>{title}</span>}
            {children}
        </div>
    ),
}));

jest.mock('formik', () => ({
    Formik: ({ children, initialValues, onSubmit, validationSchema, ...props }: any) => {
        // Prevent infinite loops by not calling onSubmit automatically
        const handleSubmit = (e: any) => {
            e?.preventDefault?.();
            // Don't auto-call onSubmit to prevent infinite loops
        };

        const formikProps = {
            values: initialValues || {},
            setFieldValue: jest.fn(),
            setFieldTouched: jest.fn(),
            errors: {},
            touched: {},
            isSubmitting: false,
            isValid: true,
            dirty: false,
            handleSubmit: handleSubmit,
            handleChange: jest.fn(),
            handleBlur: jest.fn(),
            ...props,
        };

        return (
            <form onSubmit={handleSubmit} {...props}>
                {typeof children === 'function' ? children(formikProps) : children}
            </form>
        );
    },
    Form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
}));

jest.mock('yup', () => ({
    object: jest.fn(() => ({
        shape: jest.fn(() => ({
            validate: jest.fn(() => Promise.resolve(true)),
            validateSync: jest.fn(() => true),
        })),
    })),
    string: jest.fn(() => ({
        required: jest.fn(() => ({
            min: jest.fn(() => ({})),
            max: jest.fn(() => ({})),
        })),
    })),
    boolean: jest.fn(() => ({
        required: jest.fn(() => ({})),
    })),
    number: jest.fn(() => ({
        required: jest.fn(() => ({
            min: jest.fn(() => ({})),
            max: jest.fn(() => ({})),
        })),
    })),
}));

const createMockStore = () => {
    return configureStore({
        reducer: {
            alert: alertReducer,
            authentication: authReducer,
        },
        preloadedState: {
            alert: { show: false, variant: '', message: '', title: '' },
            authentication: {
                isAuthenticated: false,
                authToken: '',
                user: { id: 0, name: '', full_name: '', role: '', institution_id: 0 },
                _persist: { version: -1, rehydrated: true },
            },
        },
    });
};

const renderComponent = (mode: 'create' | 'update' = 'create') => {
    const store = createMockStore();
    return render(
        <Provider store={store}>
            <BrowserRouter>
                <AssignmentEditor mode={mode} />
            </BrowserRouter>
        </Provider>
    );
};

describe('AssignmentEditor', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseAPICallOrder = 0; // Reset call order before each test
        // Reset data to undefined to prevent useEffect triggers
        mockUseAPIInstance1.data = undefined;
        mockUseAPIInstance2.data = undefined;
        mockUseAPIInstance3.data = undefined;
    });

    it('renders without crashing', () => {
        const { unmount } = renderComponent();
        expect(screen.getByText(/Creating Assignment/i)).toBeInTheDocument();
        unmount();
    });

    it('displays correct title for create mode', () => {
        const { unmount } = renderComponent('create');
        expect(screen.getByText('Creating Assignment')).toBeInTheDocument();
        unmount();
    });

    it('displays correct title for update mode', () => {
        const { unmount } = renderComponent('update');
        expect(screen.getByText(/Editing Assignment:/i)).toBeInTheDocument();
        unmount();
    });

    it('renders all tabs', () => {
        const { unmount } = renderComponent();
        expect(screen.getByText('General')).toBeInTheDocument();
        expect(screen.getByText('Topics')).toBeInTheDocument();
        expect(screen.getByText('Rubrics')).toBeInTheDocument();
        expect(screen.getByText('Review strategy')).toBeInTheDocument();
        expect(screen.getByText('Due dates')).toBeInTheDocument();
        expect(screen.getByText('Calibration')).toBeInTheDocument();
        expect(screen.getByText('Etc.')).toBeInTheDocument();
        unmount();
    });

    it('renders Save button', () => {
        const { unmount } = renderComponent();
        expect(screen.getByText('Save')).toBeInTheDocument();
        unmount();
    });

    it('renders Back link', () => {
        const { unmount } = renderComponent();
        expect(screen.getAllByText('Back').length).toBeGreaterThan(0);
        unmount();
    });

    it('renders form inputs in General tab', () => {
        const { unmount } = renderComponent();
        expect(screen.getByTestId('input-name')).toBeInTheDocument();
        expect(screen.getByTestId('input-directory_path')).toBeInTheDocument();
        expect(screen.getByTestId('input-spec_location')).toBeInTheDocument();
        unmount();
    });

    it('renders checkboxes in General tab', () => {
        const { unmount } = renderComponent();
        expect(screen.getByTestId('checkbox-private')).toBeInTheDocument();
        expect(screen.getByTestId('checkbox-has_teams')).toBeInTheDocument();
        expect(screen.getByTestId('checkbox-has_mentors')).toBeInTheDocument();
        expect(screen.getByTestId('checkbox-has_topics')).toBeInTheDocument();
        unmount();
    });

    it('renders course select dropdown', () => {
        const { unmount } = renderComponent();
        expect(screen.getByTestId('select-course_id')).toBeInTheDocument();
        unmount();
    });

    describe('Tab Navigation', () => {
        it('renders Topics tab content when clicked', () => {
            const { unmount } = renderComponent();
            const topicsTab = screen.getByText('Topics');
            topicsTab.click();
            expect(screen.getByText(/Topics for/i)).toBeInTheDocument();
            unmount();
        });

        it('renders Rubrics tab content when clicked', () => {
            const { unmount } = renderComponent();
            const rubricsTab = screen.getByText('Rubrics');
            rubricsTab.click();
            expect(screen.getByTestId('checkbox-review_rubric_varies_by_round')).toBeInTheDocument();
            unmount();
        });

        it('renders Review strategy tab content when clicked', () => {
            const { unmount } = renderComponent();
            const reviewStrategyTab = screen.getByText('Review strategy');
            reviewStrategyTab.click();
            expect(screen.getByTestId('select-review_strategy')).toBeInTheDocument();
            unmount();
        });

        it('renders Due dates tab content when clicked', () => {
            const { unmount } = renderComponent();
            const dueDatesTab = screen.getByText('Due dates');
            dueDatesTab.click();
            expect(screen.getByTestId('input-number_of_review_rounds')).toBeInTheDocument();
            unmount();
        });

        it('renders Calibration tab content when clicked', () => {
            const { unmount } = renderComponent();
            const calibrationTab = screen.getByText('Calibration');
            calibrationTab.click();
            expect(screen.getByText('Submit reviews for calibration')).toBeInTheDocument();
            unmount();
        });

        it('renders Etc tab content when clicked', () => {
            const { unmount } = renderComponent();
            const etcTab = screen.getByText('Etc.');
            etcTab.click();
            expect(screen.getByText('Add Participant')).toBeInTheDocument();
            expect(screen.getByText('Create Teams')).toBeInTheDocument();
            unmount();
        });
    });

    describe('Form Fields', () => {
        it('renders all basic form fields', () => {
            const { unmount } = renderComponent();
            expect(screen.getByTestId('input-name')).toBeInTheDocument();
            expect(screen.getByTestId('input-directory_path')).toBeInTheDocument();
            expect(screen.getByTestId('input-spec_location')).toBeInTheDocument();
            unmount();
        });

        it('renders review strategy fields', () => {
            const { unmount } = renderComponent();
            const reviewStrategyTab = screen.getByText('Review strategy');
            reviewStrategyTab.click();
            expect(screen.getByTestId('input-set_required_number_of_reviews_per_reviewer')).toBeInTheDocument();
            expect(screen.getByTestId('input-set_allowed_number_of_reviews_per_reviewer')).toBeInTheDocument();
            unmount();
        });

        it('renders due dates fields', () => {
            const { unmount } = renderComponent();
            const dueDatesTab = screen.getByText('Due dates');
            dueDatesTab.click();
            expect(screen.getByTestId('checkbox-use_signup_deadline')).toBeInTheDocument();
            expect(screen.getByTestId('checkbox-use_drop_topic_deadline')).toBeInTheDocument();
            unmount();
        });
    });
});
