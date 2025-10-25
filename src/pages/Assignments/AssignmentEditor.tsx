import * as Yup from "yup";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { faUserCheck } from '@fortawesome/free-solid-svg-icons';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { faChartBar } from '@fortawesome/free-solid-svg-icons';
import { Button, Modal } from "react-bootstrap";
import { Form, Formik, FormikHelpers } from "formik";
import { IAssignmentFormValues, transformAssignmentRequest } from "./AssignmentUtil";
import { IEditor } from "../../utils/interfaces";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLoaderData, useLocation, useNavigate } from "react-router-dom";
import FormInput from "components/Form/FormInput";
import FormSelect from "components/Form/FormSelect";
import { HttpMethod } from "utils/httpMethods";
import { RootState } from "../../store/store";
import { alertActions } from "store/slices/alertSlice";
import useAPI from "hooks/useAPI";
import FormCheckbox from "components/Form/FormCheckBox";
import { Tabs, Tab } from 'react-bootstrap';
import '../../custom.scss';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import Table from "components/Table/Table";

const initialValues: IAssignmentFormValues = {
  name: "",
  directory_path: "",
  // dir: "",
  spec_location: "",
  private: false,
  show_template_review: false,
  require_quiz: false,
  has_badge: false,
  staggered_deadline: false,
  is_calibrated: false,
  has_teams: false,
  max_team_size: 1,
  show_teammate_review: false,
  is_pair_programming: false,
  has_mentors: false,
  has_topics: false,
  review_topic_threshold: 0,
  maximum_number_of_reviews_per_submission: 0,
  review_strategy: "",
  review_rubric_varies_by_round: false,
  review_rubric_varies_by_topic: false,
  review_rubric_varies_by_role: false,
  has_max_review_limit: false,
  set_allowed_number_of_reviews_per_reviewer: 0,
  set_required_number_of_reviews_per_reviewer: 0,
  is_review_anonymous: false,
  is_review_done_by_teams: false,
  allow_self_reviews: false,
  reviews_visible_to_other_reviewers: false,
  number_of_review_rounds: 0,
  // Add other assignment-specific initial values
};

const validationSchema = Yup.object({
  name: Yup.string().required("Required")
  // Add other assignment-specific validation rules
});

const AssignmentEditor = ({ mode }: { mode: "create" | "update" }) => {
  const { data: assignmentResponse, error: assignmentError, sendRequest } = useAPI();
  const auth = useSelector(
    (state: RootState) => state.authentication,
    (prev, next) => prev.isAuthenticated === next.isAuthenticated
  );
  const assignmentData: any = useLoaderData();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Close the modal if the assignment is updated successfully and navigate to the assignments page
  useEffect(() => {
    if (
      assignmentResponse &&
      assignmentResponse.status >= 200 &&
      assignmentResponse.status < 300
    ) {
      dispatch(
        alertActions.showAlert({
          variant: "success",
          message: `Assignment ${assignmentData.name} ${mode}d successfully!`,
        })
      );
      navigate(location.state?.from ? location.state.from : "/assignments");
    }
  }, [dispatch, mode, navigate, assignmentData, assignmentResponse, location.state?.from]);

  // Show the error message if the assignment is not updated successfully
  useEffect(() => {
    assignmentError && dispatch(alertActions.showAlert({ variant: "danger", message: assignmentError }));
  }, [assignmentError, dispatch]);

  const onSubmit = (
    values: IAssignmentFormValues,
    submitProps: FormikHelpers<IAssignmentFormValues>
  ) => {
    let method: HttpMethod = HttpMethod.POST;
    let url: string = "/assignments";
    if (mode === "update") {
      url = `/assignments/${values.id}`;
      method = HttpMethod.PATCH;
    }
    // to be used to display message when assignment is created
    assignmentData.name = values.name;
    console.log(values);
    sendRequest({
      url: url,
      method: method,
      data: values,
      transformRequest: transformAssignmentRequest,
    });
    submitProps.setSubmitting(false);
  };

  const handleClose = () => navigate(location.state?.from ? location.state.from : "/assignments");

  return (
    <div>
      <h1>Editing Assignment: {assignmentData.name}</h1>

      <Formik
        initialValues={mode === "update" ? assignmentData : initialValues}
        onSubmit={onSubmit}
        validationSchema={validationSchema}
        validateOnChange={false}
        enableReinitialize={true}
      >
        {(formik) => (
          <Form>
            <Tabs defaultActiveKey="general" id="assignment-tabs">
              {/* General Tab */}
              <Tab eventKey="general" title="General">
                <FormInput controlId="assignment-name" label="Assignment Name" name="name" />
                <FormSelect
                  controlId="assignment-course_id"
                  label="Course"
                  name="course_id"
                  options={[
                    { label: "Course 1", value: 1 },
                    { label: "Course 2", value: 2 },
                    { label: "Course 3", value: 3 },
                  ]}
                />
                <FormInput controlId="assignment-directory_path" label="Submission Directory" name="directory_path" />
                <FormInput controlId="assignment-spec_location" label="Description URL" name="spec_location" />

                <FormCheckbox controlId="assignment-private" label="Private Assignment" name="private" />

                <FormCheckbox controlId="assignment-has_teams" label="Has teams?" name="has_teams" />
                {formik.values.has_teams && (
                  <>
                    <FormInput controlId="assignment-max_team_size" label="Max Team Size" name="max_team_size" type="number" />
                    <FormCheckbox controlId="assignment-show_teammate_review" label="Show teammate reviews?" name="show_teammate_review" />
                    <FormCheckbox controlId="assignment-is_pair_programming" label="Pair Programming?" name="is_pair_programming" />
                  </>
                )}

                <FormCheckbox controlId="assignment-has_mentors" label="Has mentors?" name="has_mentors" />
                {formik.values.has_mentors && (
                  <FormCheckbox controlId="assignment-auto_assign_mentors" label="Auto-assign mentors when team hits > 50% capacity?" name="auto_assign_mentors" />
                )}

                <FormCheckbox controlId="assignment-has_topics" label="Has topics?" name="has_topics" />
                {formik.values.has_topics && (
                  <FormCheckbox controlId="assignment-staggered_deadline_assignment" label="Staggered deadline assignment?" name="staggered_deadline_assignment" />
                )}

                <FormCheckbox controlId="assignment-has_quizzes" label="Has quizzes?" name="has_quizzes" />
                <FormCheckbox controlId="assignment-calibration_for_training" label="Calibration for training?" name="calibration_for_training" />
                <FormCheckbox controlId="assignment-allow_tag_prompts" label="Allow tag prompts so author can tag feedback comments?" name="allow_tag_prompts" />
                <FormCheckbox controlId="assignment-available_to_students" label="Available to students?" name="available_to_students" />
              </Tab>

              {/* Topics Tab */}
              <Tab eventKey="topics" title="Topics">
                <h2>Topics for {assignmentData.name}</h2>
                <FormCheckbox controlId="assignment-allow_topic_suggestions_from_students" label="Allow topic suggestions from students?" name="allow_topic_suggestion_from_students" />
                <FormCheckbox controlId="assignment-enable_bidding_for_topics" label="Enable bidding for topics?" name="enable_bidding_for_topics" />
                <FormCheckbox controlId="assignment-enable_bidding_for_reviews" label="Enable bidding for reviews?" name="enable_bidding_for_reviews" />
                <FormCheckbox controlId="assignment-enable_authors_to_review_others" label="Enable authors to review others working on same topic?" name="enable_authors_to_review_other_topics" />
                <FormCheckbox controlId="assignment-allow_reviewer_to_choose_topic_to_review" label="Allow reviewer to choose which topic to review?" name="allow_reviewer_to_choose_topic_to_review" />
                <FormCheckbox controlId="assignment-allow_participants_to_create_bookmarks" label="Allow participants to create bookmarks?" name="allow_participants_to_create_bookmarks" />

                {/* TODO: Add topics table here */}
                <div className="d-flex justify-content-start gap-2">
                  <a href="#">New topic</a> |
                  <a href="#">Import topics</a> |
                  <Button variant="primary">Delete selected topics</Button> |
                  <Button variant="primary">Delete all topics</Button> |
                  <a href="#">Back</a>
                </div>
              </Tab>

              {/* Rubrics Tab */}
              <Tab eventKey="rubrics" title="Rubrics">
                <FormCheckbox controlId="assignment-review_rubric_varies_by_round" label="Review rubric varies by round?" name="review_rubric_varies_by_round" />
                <FormCheckbox controlId="assignment-review_rubric_varies_by_topic" label="Review rubric varies by topic?" name="review_rubric_varies_by_topic" />
                <FormCheckbox controlId="assignment-review_rubric_varies_by_role" label="Review rubric varies by role?" name="review_rubric_varies_by_role" />

                <Table
                  showColumnFilter={false}
                  showGlobalFilter={false}
                  showPagination={false}
                  data={[
                    {
                      id: 1,
                      title: "Review",
                      questionnaire: <></>,
                      weight: "100%",
                      notification_limit: "1 hour before deadline",
                    },
                  ]}
                  columns={[
                    { accessorKey: "title", header: "", enableSorting: false, enableColumnFilter: false },
                    { accessorKey: "questionnaire", header: "Questionnaire", enableSorting: false, enableColumnFilter: false },
                    { accessorKey: "weight", header: "Weight", enableSorting: false, enableColumnFilter: false },
                    { accessorKey: "notification_limit", header: "Notification Limit", enableSorting: false, enableColumnFilter: false },
                  ]}
                />
              </Tab>

              {/* Review Strategy Tab */}
              <Tab eventKey="review_strategy" title="Review strategy">
                <FormSelect
                  controlId="assignment-review_strategy"
                  label="Review strategy"
                  name="review_strategy"
                  options={[
                    { label: "Review Strategy 1", value: 1 },
                    { label: "Review Strategy 2", value: 2 },
                    { label: "Review Strategy 3", value: 3 },
                  ]}
                />
                {formik.values.has_topics && (
                  <FormInput controlId="assignment-review_topic_threshold" label="Review topic threshold (k)" name="review_topic_threshold" type="number" />
                )}
                <FormInput controlId="assignment-maximum_number_of_reviews_per_submission" label="Maximum number of reviews per submission" name="maximum_number_of_reviews_per_submission" type="number" />
                <FormCheckbox controlId="assignment-has_max_review_limit" label="Has max review limit?" name="has_max_review_limit" />
                <FormInput controlId="assignment-set_allowed_number_of_reviews_per_reviewer" label="Set allowed number of reviews per reviewer" name="set_allowed_number_of_reviews_per_reviewer" type="number" />
                <FormInput controlId="assignment-set_required_number_of_reviews_per_reviewer" label="Set required number of reviews per reviewer" name="set_required_number_of_reviews_per_reviewer" type="number" />
                <FormCheckbox controlId="assignment-is_review_anonymous" label="Is review anonymous?" name="is_review_anonymous" />
                <FormCheckbox controlId="assignment-is_review_done_by_teams" label="Is review done by teams?" name="is_review_done_by_teams" />
                <FormCheckbox controlId="assignment-allow_self_reviews" label="Allow self-reviews?" name="allow_self_reviews" />
                <FormCheckbox controlId="assignment-reviews_visible_to_other_reviewers" label="Reviews visible to other reviewers?" name="reviews_visible_to_other_reviewers" />

              </Tab>

              {/* Due dates Tab */}
              <Tab eventKey="due_dates" title="Due dates">
                <FormInput controlId="assignment-number_of_review_rounds" label="Number of review rounds" name="number_of_review_rounds" type="number" />
                <button type="button" className="btn btn-primary">Set</button>

                <FormCheckbox controlId="assignment-use_signup_deadline" label="Use signup deadline" name="use_signup_deadline" />
                <FormCheckbox controlId="assignment-use_drop_topic_deadline" label="Use drop-topic deadline" name="use_drop_topic_deadline" />
                <FormCheckbox controlId="assignment-use_team_formation_deadline" label="Use team-formation deadline" name="use_team_formation_deadline" />

              </Tab>

              {/* Etc Tab */}
              <Tab eventKey="etc" title="Etc">
                <div className="assignment-actions d-flex flex-wrap justify-content-start">
                  <div className="custom-tab-button" onClick={() => navigate(`participants`)}>
                    <FontAwesomeIcon icon={faUser} className="icon" />
                    <span>Add Participant</span>
                  </div>
                  <div className="custom-tab-button" onClick={() => navigate(`/assignments/edit/${assignmentData.id}/createteams`)}>
                    <FontAwesomeIcon icon={faUsers} className="icon" />
                    <span>Create Teams</span>
                  </div>
                  <div className="custom-tab-button" onClick={() => navigate(`/assignments/edit/${assignmentData.id}/assignreviewer`)}>
                    <FontAwesomeIcon icon={faUserCheck} className="icon" />
                    <span>Assign Reviewer</span>
                  </div>
                  <div className="custom-tab-button" onClick={() => navigate(`/assignments/edit/${assignmentData.id}/viewsubmissions`)}>
                    <FontAwesomeIcon icon={faClipboardList} className="icon" />
                    <span>View Submissions</span>
                  </div>
                  <div className="custom-tab-button" onClick={() => navigate(`/assignments/edit/${assignmentData.id}/viewscores`)}>
                    <FontAwesomeIcon icon={faChartBar} className="icon" />
                    <span>View Scores</span>
                  </div>
                  <div className="custom-tab-button" onClick={() => navigate(`/assignments/edit/${assignmentData.id}/viewreports`)}>
                    <FontAwesomeIcon icon={faFileAlt} className="icon" />
                    <span>View Reports</span>
                  </div>
                  <div className="custom-tab-button" onClick={() => navigate(`/assignments/edit/${assignmentData.id}/viewdelayedjobs`)}>
                    <FontAwesomeIcon icon={faClock} className="icon" />
                    <span>View Delayed Jobs</span>
                  </div>
                </div>
              </Tab>
            </Tabs>

            {/* Submit button */}
            <div className="mt-3 d-flex justify-content-start gap-2">
              <Button type="submit" variant="primary">
                Save
              </Button> | 
              <a href="/assignments" className="">Back</a>
            </div>
          </Form>
        )}
      </Formik>
    </div>

  );

  return (
    <Modal size="lg" centered show={true} onHide={handleClose} backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{mode === "update" ? `Update Assignment - ${assignmentData.name}` : "Create Assignment"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {assignmentError && <p className="text-danger">{assignmentError}</p>}
        <Tabs defaultActiveKey="general" id="assignment-tabs">
          <Tab eventKey="general" title="General">
            <Formik
              initialValues={mode === "update" ? assignmentData : initialValues}
              onSubmit={onSubmit}
              validationSchema={validationSchema}
              validateOnChange={false}
              enableReinitialize={true}
            >
              {(formik) => {
                return (
                  <Form>
                    <FormInput controlId="assignment-name" label="Assignment Name" name="name" />
                    <FormInput controlId="assignment-directory_path" label="Submission Directory" name="directory_path" />
                    <FormInput controlId="assignment-spec_location" label="Description URL" name="spec_location" />
                    <FormInput controlId="assignment-submitter_count" label="Submitter Count" name="submitter_count" type="number" />
                    <FormInput controlId="assignment-num_reviews" label="Number of Reviews" name="num_reviews" type="number" />
                    <FormInput controlId="assignment-num_review_of_reviews" label="Number of Review of Reviews" name="num_review_of_reviews" type="number" />
                    <FormInput controlId="assignment-num_review_of_reviewers" label="Number of Review of Reviewers" name="num_review_of_reviewers" type="number" />
                    <FormInput controlId="assignment-num_reviewers" label="Number of Reviewers" name="num_reviewers" type="number" />
                    <FormCheckbox controlId="assignment-has-teams-modal" label="Has teams?" name="has_teams" />
                    {formik.values.has_teams && (
                      <FormInput controlId="assignment-max_team_size" label="Max Team Size" name="max_team_size" type="number" />
                    )}
                    <FormInput controlId="assignment-days_between_submissions" label="Days Between Submissions" name="days_between_submissions" type="number" />
                    <FormInput controlId="assignment-review_assignment_strategy" label="Review Assignment Strategy" name="review_assignment_strategy" />
                    <FormInput controlId="assignment-max_reviews_per_submission" label="Max Reviews Per Submission" name="max_reviews_per_submission" type="number" />
                    <FormInput controlId="assignment-review_topic_threshold" label="Review Topic Threshold" name="review_topic_threshold" type="number" />
                    <FormInput controlId="assignment-rounds_of_reviews" label="Rounds of Reviews" name="rounds_of_reviews" type="number" />
                    <FormInput controlId="assignment-num_quiz_questions" label="Number of Quiz Questions" name="num_quiz_questions" type="number" />
                    <FormInput controlId="assignment-late_policy_id" label="Late Policy ID" name="late_policy_id" type="number" />
                    <FormInput controlId="assignment-max_bids" label="Max Bids" name="max_bids" type="number" />
                    <FormCheckbox controlId="assignment-private" label="Private Assignment" name="private" />
                    <FormCheckbox controlId="assignment-show_teammate_review" label="Show Teammate Reviews?" name="show_teammate_review" />
                    <FormCheckbox controlId="assignment-require_quiz" label="Has quiz?" name="require_quiz" />
                    <FormCheckbox controlId="assignment-has_badge" label="Has badge?" name="has_badge" />
                    <FormCheckbox controlId="assignment-staggered_deadline" label="Staggered deadline assignment?" name="staggered_deadline" />
                    <FormCheckbox controlId="assignment-is_calibrated" label="Calibration for training?" name="is_calibrated" />
                    <FormCheckbox controlId="assignment-reviews_visible_to_all" label="Reviews Visible to All" name="reviews_visible_to_all" />
                    <FormCheckbox controlId="assignment-allow_suggestions" label="Allow Suggestions" name="allow_suggestions" />
                    <FormCheckbox controlId="assignment-copy_flag" label="Copy Flag" name="copy_flag" />
                    <FormCheckbox controlId="assignment-microtask" label="Microtask" name="microtask" />
                    <FormCheckbox controlId="assignment-is_coding_assignment" label="Is Coding Assignment" name="is_coding_assignment" />
                    <FormCheckbox controlId="assignment-is_intelligent" label="Is Intelligent" name="is_intelligent" />
                    <FormCheckbox controlId="assignment-calculate_penalty" label="Calculate Penalty" name="calculate_penalty" />
                    <FormCheckbox controlId="assignment-is_penalty_calculated" label="Is Penalty Calculated" name="is_penalty_calculated" />
                    <FormCheckbox controlId="assignment-availability_flag" label="Availability Flag" name="availability_flag" />
                    <FormCheckbox controlId="assignment-use_bookmark" label="Use Bookmark" name="use_bookmark" />
                    <FormCheckbox controlId="assignment-can_review_same_topic" label="Can Review Same Topic" name="can_review_same_topic" />
                    <FormCheckbox controlId="assignment-can_choose_topic_to_review" label="Can Choose Topic to Review" name="can_choose_topic_to_review" />
                    <Modal.Footer>
                      <Button variant="outline-secondary" onClick={handleClose}>
                        Close
                      </Button>

                      <Button
                        variant="outline-success"
                        type="submit"
                        disabled={!(formik.isValid && formik.dirty) || formik.isSubmitting}
                      >
                        {mode === "update" ? "Update Assignment" : "Create Assignment"}
                      </Button>
                    </Modal.Footer>
                  </Form>
                );
              }}
            </Formik>
          </Tab>
          <Tab eventKey="etc" title="Etc">
            <div className="assignment-actions d-flex flex-wrap justify-content-start">
              <div className="custom-tab-button" onClick={() => navigate(`participants`)}>
                <FontAwesomeIcon icon={faUser} className="icon" />
                <span>Add Participant</span>
              </div>
              <div className="custom-tab-button" onClick={() => navigate(`/assignments/edit/${assignmentData.id}/createteams`)}>
                <FontAwesomeIcon icon={faUsers} className="icon" />
                <span>Create Teams</span>
              </div>

              <div className="custom-tab-button" onClick={() => navigate(`/assignments/edit/${assignmentData.id}/assignreviewer`)}>
                <FontAwesomeIcon icon={faUserCheck} className="icon" />
                <span>Assign Reviewer</span>
              </div>
              <div className="custom-tab-button" onClick={() => navigate(`/assignments/edit/${assignmentData.id}/viewsubmissions`)}>
                <FontAwesomeIcon icon={faClipboardList} className="icon" />
                <span>View Submissions</span>
              </div>
              <div className="custom-tab-button" onClick={() => navigate(`/assignments/edit/${assignmentData.id}/viewscores`)}>
                <FontAwesomeIcon icon={faChartBar} className="icon" />
                <span>View Scores</span>
              </div>
              <div className="custom-tab-button" onClick={() => navigate(`/assignments/edit/${assignmentData.id}/viewreports`)}>
                <FontAwesomeIcon icon={faFileAlt} className="icon" />
                <span>View Reports</span>
              </div>
              <div className="custom-tab-button" onClick={() => navigate(`/assignments/edit/${assignmentData.id}/viewdelayedjobs`)}>
                <FontAwesomeIcon icon={faClock} className="icon" />
                <span>View Delayed Jobs</span>
              </div>
            </div>

          </Tab>
        </Tabs>
      </Modal.Body>
    </Modal>
  );
};

export default AssignmentEditor;