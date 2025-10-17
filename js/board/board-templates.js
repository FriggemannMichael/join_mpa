export const boardTemplates = {

    editTask: `


        <div class="form-group">
            <label for="editTaskTitle">Title</label>
            <input type="text" id="editTaskTitle" placeholder="Enter a title" />
        </div>

        <div class="form-group">
            <label for="editTaskDescription">Description</label>
            <textarea id="editTaskDescription" placeholder="Enter a Description"></textarea>
        </div>

        <div class="form-group">
            <label for="editTaskDueDate">Due date</label>
            <input type="date" lang="en-GB" id="editTaskDueDate" />
        </div>


        <div class="form-group">
                <label>Priority</label>
                <div
                  class="priority-buttons"
                  role="group"
                  aria-label="Priority selection"
                >
                  <button
                    class="priority-btn"
                    data-priority="urgent"
                    type="button"
                  >
                    Urgent
                    <img
                      class="prio-icon"
                      src="./img/icon/prio-urgent.svg"
                      alt="Urgent priority"
                    />
                  </button>
                  <button
                    class="priority-btn"
                    data-priority="medium"
                    type="button"
                  >
                    Medium
                    <img
                      class="prio-icon"
                      src="./img/icon/prio-medium.svg"
                      alt="Medium priority"
                    />
                  </button>
                  <button
                    class="priority-btn"
                    data-priority="low"
                    type="button"
                  >
                    Low
                    <img
                      class="prio-icon"
                      src="./img/icon/prio-low.svg"
                      alt="Low priority"
                    />
                  </button>
                </div>
              </div>


        <div class="form-group">
                <label for="taskAssignees">Assigned to</label>
                <div class="custom-multiselect">
                  <div class="multiselect-header" id="assigneeHeader">
                    <span id="selected-assignees-placeholder"
                      >Select contacts to assign</span
                    >
                    <img
                      src="./img/icon/arrow_drop_down.svg"
                      class="dropdown-icon"
                      alt="dropdown"
                    />
                  </div>
                  <div
                    class="multiselect-dropdown d-none"
                    id="assignee-dropdown"
                  >
                    <!-- Dynamically filled -->
                  </div>
                </div>
                <div
                  class="selected-assignee-avatars"
                  id="selected-assignee-avatars"
                ></div>
              </div>

        
       <div class="form-group">
                <label for="editSubtasks">Subtasks</label>
                <div class="editSubtask-input-container">
                  <input
                    type="text"
                    id="taskSubtasks"
                    class="form-input subtask-input"
                    placeholder="Add new subtask"
                  />
                  <div class="subtask-btn">
                    <div class="check-cancel-div" id="subtaskIcons">
                      <div class="subtask-cancel" id="subtaskClose">
                        <!-- Close icon wird hier eingefügt -->
                      </div>
                      <div class="subtask-divider"></div>
                      <div class="subtask-check" id="subtaskCheck">
                        <!-- Check icon wird hier eingefügt -->
                      </div>
                    </div>
                    <img
                      src="./img/icon/add.svg"
                      alt="Add subtask"
                      id="subtaskAddIcon"
                    />
                  </div>
                </div>
                <div class="subtasks-list" id="subtasksList">
                  <!-- Subtasks werden hier dynamisch hinzugefügt -->
                </div>
              </div>

    
    `

}