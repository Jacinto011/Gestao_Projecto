// Estrutura de dados inicial
let data = {
    users: [
        { id: "2002", name: "Jacinto Patricio" }
    ],
    projects: [],
    tasks: [],
    currentUser: null
};

// Elementos do DOM
const loginScreen = document.getElementById('login-screen');
const mainScreen = document.getElementById('main-screen');
const userIdInput = document.getElementById('user-id');
const loginBtn = document.getElementById('login-btn');
const loginMessage = document.getElementById('login-message');
const loggedUserSpan = document.getElementById('logged-user');
const logoutBtn = document.getElementById('logout-btn');
const viewProjectsBtn = document.getElementById('view-projects-btn');
const viewTasksBtn = document.getElementById('view-tasks-btn');
const viewGanttBtn = document.getElementById('view-gantt-btn');
const manageUsersBtn = document.getElementById('manage-users-btn');
const projectsSection = document.getElementById('projects-section');
const myTasksSection = document.getElementById('my-tasks-section');
const ganttSection = document.getElementById('gantt-section');
const usersSection = document.getElementById('users-section');
const projectsList = document.getElementById('projects-list');
const myTasksList = document.getElementById('my-tasks-list');
const usersList = document.getElementById('users-list');
const ganttChart = document.getElementById('gantt-chart');
const ganttProjectSelect = document.getElementById('gantt-project-select');
const addProjectBtn = document.getElementById('add-project-btn');
const addUserBtn = document.getElementById('add-user-btn');

// Modais
const modalBackdrop = document.getElementById('modal-backdrop');
const projectModal = document.getElementById('project-modal');
const taskModal = document.getElementById('task-modal');
const userModal = document.getElementById('user-modal');
const confirmModal = document.getElementById('confirm-modal');

// Formulários
const projectForm = document.getElementById('project-form');
const taskForm = document.getElementById('task-form');
const userForm = document.getElementById('user-form');

// Carregar dados do localStorage
function loadData() {
    const savedData = localStorage.getItem('projectManagementData');
    if (savedData) {
        data = JSON.parse(savedData);
    }
}

// Salvar dados no localStorage
function saveData() {
    localStorage.setItem('projectManagementData', JSON.stringify(data));
}

// Inicializar a aplicação
function init() {
    loadData();
    setupEventListeners();
    checkAlerts();
}

// Configurar event listeners
function setupEventListeners() {
    // Login
    loginBtn.addEventListener('click', handleLogin);
    userIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    logoutBtn.addEventListener('click', handleLogout);
    
    // Navegação
    viewProjectsBtn.addEventListener('click', () => switchSection('projects'));
    viewTasksBtn.addEventListener('click', () => switchSection('tasks'));
    viewGanttBtn.addEventListener('click', () => switchSection('gantt'));
    manageUsersBtn.addEventListener('click', () => switchSection('users'));
    
    // Botões de ação
    addProjectBtn.addEventListener('click', () => openProjectModal());
    addUserBtn.addEventListener('click', () => openUserModal());
    
    // Modais
    document.querySelectorAll('.close-modal, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    modalBackdrop.addEventListener('click', closeAllModals);
    
    // Formulários
    projectForm.addEventListener('submit', handleProjectSubmit);
    taskForm.addEventListener('submit', handleTaskSubmit);
    userForm.addEventListener('submit', handleUserSubmit);
    
    // Confirmação
    document.getElementById('confirm-yes').addEventListener('click', confirmAction);
    document.getElementById('confirm-no').addEventListener('click', closeAllModals);
    
    // Gantt
    ganttProjectSelect.addEventListener('change', renderGanttChart);
}

// Manipulador de login
function handleLogin() {
    const userId = userIdInput.value.trim();
    const user = data.users.find(u => u.id === userId);
    
    if (user) {
        data.currentUser = user;
        loggedUserSpan.textContent = `${user.name} (ID: ${user.id})`;
        loginScreen.classList.remove('active');
        mainScreen.classList.add('active');
        renderProjects();
        renderUsers();
        switchSection('projects');
        loginMessage.textContent = '';
    } else {
        loginMessage.textContent = 'ID de colaborador não encontrado.';
    }
    
    userIdInput.value = '';
}

// Manipulador de logout
function handleLogout() {
    data.currentUser = null;
    mainScreen.classList.remove('active');
    loginScreen.classList.add('active');
}

// Alternar entre seções
function switchSection(section) {
    // Atualizar botões de navegação
    viewProjectsBtn.classList.remove('active');
    viewTasksBtn.classList.remove('active');
    viewGanttBtn.classList.remove('active');
    manageUsersBtn.classList.remove('active');
    
    // Esconder todas as seções
    projectsSection.classList.remove('active');
    myTasksSection.classList.remove('active');
    ganttSection.classList.remove('active');
    usersSection.classList.remove('active');
    
    // Mostrar a seção selecionada
    switch (section) {
        case 'projects':
            viewProjectsBtn.classList.add('active');
            projectsSection.classList.add('active');
            renderProjects();
            break;
        case 'tasks':
            viewTasksBtn.classList.add('active');
            myTasksSection.classList.add('active');
            renderUserTasks();
            break;
        case 'gantt':
            viewGanttBtn.classList.add('active');
            ganttSection.classList.add('active');
            setupGanttProjectSelect();
            renderGanttChart();
            break;
        case 'users':
            manageUsersBtn.classList.add('active');
            usersSection.classList.add('active');
            renderUsers();
            break;
    }
}

// Renderizar projetos
function renderProjects() {
    projectsList.innerHTML = '';
    
    if (data.projects.length === 0) {
        projectsList.innerHTML = '<p class="no-projects">Nenhum projeto encontrado. Adicione um novo projeto para começar.</p>';
        return;
    }
    
    data.projects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'card project';
        
        const tasksInProject = data.tasks.filter(task => task.projectId === project.id);
        const completedTasks = tasksInProject.filter(task => task.status === 'completed').length;
        const progress = tasksInProject.length > 0 ? Math.round((completedTasks / tasksInProject.length) * 100) : 0;
        
        const overdueTasks = tasksInProject.filter(task => {
            return task.status !== 'completed' && new Date(task.endDate) < new Date();
        }).length;
        
        projectCard.innerHTML = `
            <div class="card-header">
                <div class="card-title">${project.name}</div>
                <div class="card-actions">
                    <button class="card-btn edit-btn" data-id="${project.id}"><i class="fas fa-edit"></i></button>
                    <button class="card-btn delete-btn" data-id="${project.id}"><i class="fas fa-trash"></i></button>
                    <button class="card-btn add-task-btn" data-id="${project.id}"><i class="fas fa-plus"></i></button>
                </div>
            </div>
            <div class="card-body">
                <p class="card-description">${project.description || 'Sem descrição'}</p>
                <div class="card-dates">
                    <span>Início: ${formatDate(project.startDate)}</span>
                    <span>Término: ${formatDate(project.endDate)}</span>
                </div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${progress}%;"></div>
                </div>
                <div class="progress-text">${progress}% concluído (${completedTasks}/${tasksInProject.length} tarefas)</div>
                ${overdueTasks > 0 ? `<div class="overdue-warning">${overdueTasks} tarefa(s) atrasada(s)</div>` : ''}
            </div>
            <div class="card-footer">
                <button class="view-tasks-btn" data-id="${project.id}">Ver Tarefas (${tasksInProject.length})</button>
            </div>
        `;
        
        projectsList.appendChild(projectCard);
    });
    
    // Adicionar event listeners aos botões dos projetos
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const projectId = e.currentTarget.getAttribute('data-id');
            openProjectModal(projectId);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const projectId = e.currentTarget.getAttribute('data-id');
            confirmDelete('project', projectId);
        });
    });
    
    document.querySelectorAll('.add-task-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const projectId = e.currentTarget.getAttribute('data-id');
            openTaskModal(null, projectId);
        });
    });
    
    document.querySelectorAll('.view-tasks-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const projectId = e.currentTarget.getAttribute('data-id');
            renderProjectTasks(projectId);
        });
    });
}

// Renderizar tarefas de um projeto
function renderProjectTasks(projectId) {
    const project = data.projects.find(p => p.id === projectId);
    if (!project) return;
    
    projectsList.innerHTML = `
        <div class="project-header">
            <button class="back-to-projects-btn"><i class="fas fa-arrow-left"></i> Voltar para projetos</button>
            <h3>Tarefas do Projeto: ${project.name}</h3>
            <button class="add-task-btn" data-id="${project.id}">Adicionar Tarefa</button>
        </div>
        <div id="project-tasks-list" class="card-container"></div>
    `;
    
    const backBtn = document.querySelector('.back-to-projects-btn');
    backBtn.addEventListener('click', () => renderProjects());
    
    const addTaskBtn = document.querySelector('.add-task-btn');
    addTaskBtn.addEventListener('click', (e) => {
        const projectId = e.currentTarget.getAttribute('data-id');
        openTaskModal(null, projectId);
    });
    
    const tasksList = document.getElementById('project-tasks-list');
    const projectTasks = data.tasks.filter(task => task.projectId === projectId);
    
    if (projectTasks.length === 0) {
        tasksList.innerHTML = '<p class="no-tasks">Nenhuma tarefa encontrada para este projeto.</p>';
        return;
    }
    
    projectTasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = `card task ${task.status} ${isTaskOverdue(task) ? 'overdue' : ''}`;
        
        const assignedUser = data.users.find(u => u.id === task.assignedTo);
        const assignedName = assignedUser ? assignedUser.name : 'Não atribuído';
        
        taskCard.innerHTML = `
            <div class="card-header">
                <div class="card-title">${task.name}</div>
                <div class="card-actions">
                    <button class="card-btn edit-btn" data-id="${task.id}"><i class="fas fa-edit"></i></button>
                    <button class="card-btn delete-btn" data-id="${task.id}"><i class="fas fa-trash"></i></button>
                    ${task.status !== 'completed' ? `<button class="card-btn complete-btn" data-id="${task.id}"><i class="fas fa-check"></i></button>` : ''}
                </div>
            </div>
            <div class="card-body">
                <p class="card-description">${task.description || 'Sem descrição'}</p>
                <div class="card-dates">
                    <span>Início: ${formatDate(task.startDate)}</span>
                    <span>Término: ${formatDate(task.endDate)}</span>
                </div>
            </div>
            <div class="card-footer">
                <span class="card-status ${getStatusClass(task)}">${getStatusText(task)}</span>
                <span class="card-assigned">Atribuído a: ${assignedName}</span>
            </div>
        `;
        
        tasksList.appendChild(taskCard);
    });
    
    // Adicionar event listeners aos botões das tarefas
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskId = e.currentTarget.getAttribute('data-id');
            openTaskModal(taskId);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskId = e.currentTarget.getAttribute('data-id');
            confirmDelete('task', taskId);
        });
    });
    
    document.querySelectorAll('.complete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskId = e.currentTarget.getAttribute('data-id');
            completeTask(taskId);
        });
    });
}

// Renderizar tarefas do usuário logado
function renderUserTasks() {
    myTasksList.innerHTML = '';
    
    if (!data.currentUser) return;
    
    const userTasks = data.tasks.filter(task => task.assignedTo === data.currentUser.id);
    
    if (userTasks.length === 0) {
        myTasksList.innerHTML = '<p class="no-tasks">Você não tem tarefas atribuídas.</p>';
        return;
    }
    
    // Agrupar tarefas por status
    const pendingTasks = userTasks.filter(task => task.status === 'pending');
    const inProgressTasks = userTasks.filter(task => task.status === 'in-progress');
    const completedTasks = userTasks.filter(task => task.status === 'completed');
    
    // Tarefas pendentes
    if (pendingTasks.length > 0) {
        const pendingSection = document.createElement('div');
        pendingSection.innerHTML = '<h3>Tarefas Pendentes</h3>';
        myTasksList.appendChild(pendingSection);
        
        pendingTasks.forEach(task => {
            const taskCard = createTaskCard(task);
            pendingSection.appendChild(taskCard);
        });
    }
    
    // Tarefas em progresso
    if (inProgressTasks.length > 0) {
        const inProgressSection = document.createElement('div');
        inProgressSection.innerHTML = '<h3>Tarefas em Progresso</h3>';
        myTasksList.appendChild(inProgressSection);
        
        inProgressTasks.forEach(task => {
            const taskCard = createTaskCard(task);
            inProgressSection.appendChild(taskCard);
        });
    }
    
    // Tarefas concluídas
    if (completedTasks.length > 0) {
        const completedSection = document.createElement('div');
        completedSection.innerHTML = '<h3>Tarefas Concluídas</h3>';
        myTasksList.appendChild(completedSection);
        
        completedTasks.forEach(task => {
            const taskCard = createTaskCard(task);
            completedSection.appendChild(taskCard);
        });
    }
}

// Criar card de tarefa
function createTaskCard(task) {
    const taskCard = document.createElement('div');
    taskCard.className = `card task ${task.status} ${isTaskOverdue(task) ? 'overdue' : ''}`;
    
    const project = data.projects.find(p => p.id === task.projectId);
    const projectName = project ? project.name : 'Projeto não encontrado';
    
    taskCard.innerHTML = `
        <div class="card-header">
            <div class="card-title">${task.name}</div>
            <div class="card-actions">
                <button class="card-btn edit-btn" data-id="${task.id}"><i class="fas fa-edit"></i></button>
                ${task.status !== 'completed' ? `<button class="card-btn complete-btn" data-id="${task.id}"><i class="fas fa-check"></i></button>` : ''}
            </div>
        </div>
        <div class="card-body">
            <p class="card-description">${task.description || 'Sem descrição'}</p>
            <div class="card-dates">
                <span>Início: ${formatDate(task.startDate)}</span>
                <span>Término: ${formatDate(task.endDate)}</span>
            </div>
            <div class="card-project">Projeto: ${projectName}</div>
        </div>
        <div class="card-footer">
            <span class="card-status ${getStatusClass(task)}">${getStatusText(task)}</span>
            ${isTaskOverdue(task) ? '<span class="overdue-label">Atrasada!</span>' : ''}
        </div>
    `;
    
    // Adicionar event listeners
    taskCard.querySelector('.edit-btn').addEventListener('click', (e) => {
        const taskId = e.currentTarget.getAttribute('data-id');
        openTaskModal(taskId);
    });
    
    const completeBtn = taskCard.querySelector('.complete-btn');
    if (completeBtn) {
        completeBtn.addEventListener('click', (e) => {
            const taskId = e.currentTarget.getAttribute('data-id');
            completeTask(taskId);
        });
    }
    
    return taskCard;
}

// Renderizar usuários
function renderUsers() {
    usersList.innerHTML = '';
    
    data.users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'card user';
        
        const userTasks = data.tasks.filter(task => task.assignedTo === user.id);
        const completedTasks = userTasks.filter(task => task.status === 'completed').length;
        
        userCard.innerHTML = `
            <div class="card-header">
                <div class="card-title">${user.name}</div>
                <div class="card-actions">
                    <button class="card-btn edit-btn" data-id="${user.id}"><i class="fas fa-edit"></i></button>
                    ${user.id !== "2002" ? `<button class="card-btn delete-btn" data-id="${user.id}"><i class="fas fa-trash"></i></button>` : ''}
                </div>
            </div>
            <div class="card-body">
                <div class="user-id">ID: ${user.id}</div>
                <div class="user-stats">Tarefas: ${userTasks.length} (${completedTasks} concluídas)</div>
            </div>
        `;
        
        usersList.appendChild(userCard);
    });
    
    // Adicionar event listeners aos botões dos usuários
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = e.currentTarget.getAttribute('data-id');
            openUserModal(userId);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = e.currentTarget.getAttribute('data-id');
            confirmDelete('user', userId);
        });
    });
}

// Configurar seletor de projetos para o gráfico de Gantt
function setupGanttProjectSelect() {
    ganttProjectSelect.innerHTML = '<option value="">Todos os Projetos</option>';
    
    data.projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        ganttProjectSelect.appendChild(option);
    });
}

// Renderizar gráfico de Gantt
function renderGanttChart() {
    const projectId = ganttProjectSelect.value;
    let tasksToDisplay = [...data.tasks];
    
    if (projectId) {
        tasksToDisplay = tasksToDisplay.filter(task => task.projectId === projectId);
    }
    
    if (tasksToDisplay.length === 0) {
        ganttChart.innerHTML = '<p class="no-tasks">Nenhuma tarefa encontrada para exibir no diagrama.</p>';
        return;
    }
    
    // Encontrar o intervalo de datas
    const allDates = [];
    tasksToDisplay.forEach(task => {
        allDates.push(new Date(task.startDate));
        allDates.push(new Date(task.endDate));
    });
    
    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));
    
    // Ajustar datas para começar na segunda-feira anterior à data mínima
    const startDate = new Date(minDate);
    startDate.setDate(startDate.getDate() - startDate.getDay() + 1);
    
    // Ajustar datas para terminar no domingo após a data máxima
    const endDate = new Date(maxDate);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    // Calcular o número de semanas
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.ceil(diffDays / 7);
    
    // Criar cabeçalho do gráfico
    let ganttHTML = '<div class="gantt-container"><div class="gantt-header"><div class="gantt-header-item" style="flex: 0 0 200px;">Tarefa</div>';
    
    // Adicionar semanas ao cabeçalho
    const currentDate = new Date(startDate);
    for (let i = 0; i < weeks; i++) {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        ganttHTML += `<div class="gantt-header-item">Semana ${i+1}<br>${formatDate(weekStart)} - ${formatDate(weekEnd)}</div>`;
        
        currentDate.setDate(currentDate.getDate() + 7);
    }
    
    ganttHTML += '</div>';
    
    // Adicionar tarefas ao gráfico
    tasksToDisplay.forEach(task => {
        const project = data.projects.find(p => p.id === task.projectId);
        const projectName = project ? project.name : '';
        
        const taskStart = new Date(task.startDate);
        const taskEnd = new Date(task.endDate);
        
        // Calcular posição da barra
        const startDiff = Math.floor((taskStart - startDate) / (1000 * 60 * 60 * 24));
        const endDiff = Math.floor((taskEnd - startDate) / (1000 * 60 * 60 * 24));
        const duration = endDiff - startDiff + 1;
        
        const startWeek = Math.floor(startDiff / 7);
        const startDay = startDiff % 7;
        
        const left = startWeek * 100 + (startDay / 7 * 100);
        const width = duration / 7 * 100;
        
        ganttHTML += `
            <div class="gantt-row">
                <div class="gantt-row-label">${task.name} (${projectName})</div>
                <div class="gantt-row-bars">
                    <div class="gantt-bar ${task.status} ${isTaskOverdue(task) ? 'overdue' : ''}" 
                         style="left: ${left}%; width: ${width}%;" 
                         title="${task.name}\n${formatDate(task.startDate)} - ${formatDate(task.endDate)}\nStatus: ${getStatusText(task)}"></div>
                </div>
            </div>
        `;
    });
    
    ganttHTML += '</div>';
    ganttChart.innerHTML = ganttHTML;
}

// Abrir modal de projeto
function openProjectModal(projectId = null) {
    closeAllModals();
    
    const modalTitle = document.getElementById('project-modal-title');
    const form = document.getElementById('project-form');
    
    if (projectId) {
        // Modo edição
        const project = data.projects.find(p => p.id === projectId);
        if (!project) return;
        
        modalTitle.textContent = 'Editar Projeto';
        document.getElementById('project-id').value = project.id;
        document.getElementById('project-name').value = project.name;
        document.getElementById('project-description').value = project.description || '';
        document.getElementById('project-start-date').value = project.startDate;
        document.getElementById('project-end-date').value = project.endDate;
    } else {
        // Modo adição
        modalTitle.textContent = 'Adicionar Projeto';
        form.reset();
        document.getElementById('project-id').value = generateId();
        
        // Definir datas padrão
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('project-start-date').value = today;
        
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        document.getElementById('project-end-date').value = nextWeek.toISOString().split('T')[0];
    }
    
    modalBackdrop.classList.remove('hidden');
    projectModal.classList.remove('hidden');
}

// Abrir modal de tarefa
function openTaskModal(taskId = null, projectId = null) {
    closeAllModals();
    
    const modalTitle = document.getElementById('task-modal-title');
    const form = document.getElementById('task-form');
    const assignedToSelect = document.getElementById('task-assigned-to');
    
    // Preencher seleção de usuários
    assignedToSelect.innerHTML = '';
    data.users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.name} (${user.id})`;
        assignedToSelect.appendChild(option);
    });
    
    if (taskId) {
        // Modo edição
        const task = data.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        modalTitle.textContent = 'Editar Tarefa';
        document.getElementById('task-id').value = task.id;
        document.getElementById('task-project-id').value = task.projectId;
        document.getElementById('task-name').value = task.name;
        document.getElementById('task-description').value = task.description || '';
        document.getElementById('task-start-date').value = task.startDate;
        document.getElementById('task-end-date').value = task.endDate;
        document.getElementById('task-assigned-to').value = task.assignedTo;
        document.getElementById('task-status').value = task.status;
    } else {
        // Modo adição
        modalTitle.textContent = 'Adicionar Tarefa';
        form.reset();
        document.getElementById('task-id').value = generateId();
        document.getElementById('task-project-id').value = projectId || '';
        document.getElementById('task-status').value = 'pending';
        
        // Definir datas padrão
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('task-start-date').value = today;
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('task-end-date').value = tomorrow.toISOString().split('T')[0];
        
        // Definir usuário atual como padrão se existir
        if (data.currentUser) {
            document.getElementById('task-assigned-to').value = data.currentUser.id;
        }
    }
    
    modalBackdrop.classList.remove('hidden');
    taskModal.classList.remove('hidden');
}

// Abrir modal de usuário
function openUserModal(userId = null) {
    closeAllModals();
    
    const modalTitle = document.getElementById('user-modal-title');
    const form = document.getElementById('user-form');
    
    if (userId) {
        // Modo edição
        const user = data.users.find(u => u.id === userId);
        if (!user) return;
        
        modalTitle.textContent = 'Editar Colaborador';
        document.getElementById('user-modal-id').value = user.id;
        document.getElementById('user-modal-name').value = user.name;
        document.getElementById('user-modal-id-input').value = user.id;
    } else {
        // Modo adição
        modalTitle.textContent = 'Adicionar Colaborador';
        form.reset();
        document.getElementById('user-modal-id').value = generateId();
    }
    
    modalBackdrop.classList.remove('hidden');
    userModal.classList.remove('hidden');
}

// Fechar todos os modais
function closeAllModals() {
    modalBackdrop.classList.add('hidden');
    projectModal.classList.add('hidden');
    taskModal.classList.add('hidden');
    userModal.classList.add('hidden');
    confirmModal.classList.add('hidden');
}

// Manipulador de envio do formulário de projeto
function handleProjectSubmit(e) {
    e.preventDefault();
    
    const project = {
        id: document.getElementById('project-id').value,
        name: document.getElementById('project-name').value,
        description: document.getElementById('project-description').value,
        startDate: document.getElementById('project-start-date').value,
        endDate: document.getElementById('project-end-date').value
    };
    
    // Validar datas
    if (new Date(project.endDate) < new Date(project.startDate)) {
        alert('A data de término não pode ser anterior à data de início.');
        return;
    }
    
    const existingIndex = data.projects.findIndex(p => p.id === project.id);
    
    if (existingIndex >= 0) {
        // Atualizar projeto existente
        data.projects[existingIndex] = project;
    } else {
        // Adicionar novo projeto
        data.projects.push(project);
    }
    
    saveData();
    renderProjects();
    setupGanttProjectSelect();
    closeAllModals();
}

// Manipulador de envio do formulário de tarefa
function handleTaskSubmit(e) {
    e.preventDefault();
    
    const task = {
        id: document.getElementById('task-id').value,
        projectId: document.getElementById('task-project-id').value,
        name: document.getElementById('task-name').value,
        description: document.getElementById('task-description').value,
        startDate: document.getElementById('task-start-date').value,
        endDate: document.getElementById('task-end-date').value,
        assignedTo: document.getElementById('task-assigned-to').value,
        status: document.getElementById('task-status').value
    };
    
    // Validar datas
    if (new Date(task.endDate) < new Date(task.startDate)) {
        alert('A data de término não pode ser anterior à data de início.');
        return;
    }
    
    // Validar projeto
    if (!data.projects.some(p => p.id === task.projectId)) {
        alert('Projeto selecionado não existe.');
        return;
    }
    
    // Validar usuário atribuído
    if (!data.users.some(u => u.id === task.assignedTo)) {
        alert('Colaborador selecionado não existe.');
        return;
    }
    
    const existingIndex = data.tasks.findIndex(t => t.id === task.id);
    
    if (existingIndex >= 0) {
        // Atualizar tarefa existente
        data.tasks[existingIndex] = task;
    } else {
        // Adicionar nova tarefa
        data.tasks.push(task);
    }
    
    saveData();
    renderProjects();
    renderUserTasks();
    renderGanttChart();
    closeAllModals();
    
    // Se estivermos visualizando tarefas de um projeto específico, atualizar essa visualização
    const projectTasksView = document.getElementById('project-tasks-list');
    if (projectTasksView) {
        const projectId = document.getElementById('task-project-id').value;
        renderProjectTasks(projectId);
    }
}

// Manipulador de envio do formulário de usuário
function handleUserSubmit(e) {
    e.preventDefault();
    
    const user = {
        id: document.getElementById('user-modal-id-input').value,
        name: document.getElementById('user-modal-name').value
    };
    
    // Verificar se o ID já existe (exceto quando estiver editando o mesmo usuário)
    const originalId = document.getElementById('user-modal-id').value;
    if (user.id !== originalId && data.users.some(u => u.id === user.id)) {
        alert('Já existe um colaborador com este ID.');
        return;
    }
    
    const existingIndex = data.users.findIndex(u => u.id === originalId);
    
    if (existingIndex >= 0) {
        // Atualizar usuário existente
        data.users[existingIndex] = user;
    } else {
        // Adicionar novo usuário
        data.users.push(user);
    }
    
    saveData();
    renderUsers();
    
    // Atualizar seleção de usuários atribuídos no modal de tarefa
    if (!taskModal.classList.contains('hidden')) {
        const currentAssignedTo = document.getElementById('task-assigned-to').value;
        const assignedToSelect = document.getElementById('task-assigned-to');
        assignedToSelect.innerHTML = '';
        
        data.users.forEach(u => {
            const option = document.createElement('option');
            option.value = u.id;
            option.textContent = `${u.name} (${u.id})`;
            assignedToSelect.appendChild(option);
        });
        
        document.getElementById('task-assigned-to').value = currentAssignedTo;
    }
    
    closeAllModals();
}

// Confirmar exclusão
function confirmDelete(type, id) {
    closeAllModals();
    
    const confirmTitle = document.getElementById('confirm-modal-title');
    const confirmMessage = document.getElementById('confirm-message');
    
    let itemName = '';
    
    switch (type) {
        case 'project':
            const project = data.projects.find(p => p.id === id);
            if (!project) return;
            itemName = `o projeto "${project.name}"`;
            break;
        case 'task':
            const task = data.tasks.find(t => t.id === id);
            if (!task) return;
            itemName = `a tarefa "${task.name}"`;
            break;
        case 'user':
            const user = data.users.find(u => u.id === id);
            if (!user) return;
            itemName = `o colaborador "${user.name}"`;
            
            // Verificar se o usuário tem tarefas atribuídas
            const userTasks = data.tasks.filter(t => t.assignedTo === id);
            if (userTasks.length > 0) {
                confirmMessage.innerHTML = `O colaborador "${user.name}" tem ${userTasks.length} tarefa(s) atribuída(s).<br>Tem certeza que deseja excluí-lo?`;
            }
            break;
    }
    
    confirmTitle.textContent = `Excluir ${itemName}`;
    if (type !== 'user' || data.tasks.filter(t => t.assignedTo === id).length === 0) {
        confirmMessage.textContent = `Tem certeza que deseja excluir ${itemName}?`;
    }
    
    // Armazenar tipo e ID para uso na confirmação
    confirmModal.dataset.type = type;
    confirmModal.dataset.id = id;
    
    modalBackdrop.classList.remove('hidden');
    confirmModal.classList.remove('hidden');
}

// Ação de confirmação
function confirmAction() {
    const type = confirmModal.dataset.type;
    const id = confirmModal.dataset.id;
    
    switch (type) {
        case 'project':
            // Excluir projeto e suas tarefas
            data.projects = data.projects.filter(p => p.id !== id);
            data.tasks = data.tasks.filter(t => t.projectId !== id);
            break;
        case 'task':
            data.tasks = data.tasks.filter(t => t.id !== id);
            break;
        case 'user':
            data.users = data.users.filter(u => u.id !== id);
            break;
    }
    
    saveData();
    
    // Atualizar visualizações
    renderProjects();
    renderUserTasks();
    renderUsers();
    renderGanttChart();
    
    closeAllModals();
}

// Concluir tarefa
function completeTask(taskId) {
    const taskIndex = data.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    data.tasks[taskIndex].status = 'completed';
    saveData();
    
    // Atualizar visualizações
    renderProjects();
    renderUserTasks();
    renderGanttChart();
    
    // Se estivermos visualizando tarefas de um projeto específico, atualizar essa visualização
    const projectTasksView = document.getElementById('project-tasks-list');
    if (projectTasksView) {
        const projectId = data.tasks[taskIndex].projectId;
        renderProjectTasks(projectId);
    }
}

// Verificar se há tarefas atrasadas e mostrar alertas
function checkAlerts() {
    if (!data.currentUser) return;
    
    const now = new Date();
    const userTasks = data.tasks.filter(task => task.assignedTo === data.currentUser.id);
    
    // Tarefas atrasadas
    const overdueTasks = userTasks.filter(task => {
        return task.status !== 'completed' && new Date(task.endDate) < now;
    });
    
    // Tarefas que estão perto do prazo (2 dias ou menos)
    const nearDeadlineTasks = userTasks.filter(task => {
        if (task.status === 'completed') return false;
        
        const endDate = new Date(task.endDate);
        const diffTime = endDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays <= 2 && diffDays >= 0;
    });
    
    // Mostrar alertas
    if (overdueTasks.length > 0) {
        setTimeout(() => {
            alert(`Você tem ${overdueTasks.length} tarefa(s) atrasada(s)!`);
        }, 1000);
    } else if (nearDeadlineTasks.length > 0) {
        setTimeout(() => {
            alert(`Você tem ${nearDeadlineTasks.length} tarefa(s) com prazo próximo!`);
        }, 1000);
    }
}

// Gerar ID único
function generateId() {
    return Math.floor(Math.random() * 1000000).toString();
}

// Formatador de data
function formatDate(dateString) {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
}

// Obter classe CSS para status
function getStatusClass(task) {
    if (task.status === 'completed') return 'status-completed';
    if (isTaskOverdue(task)) return 'status-overdue';
    if (task.status === 'in-progress') return 'status-in-progress';
    return 'status-pending';
}

// Obter texto do status
function getStatusText(task) {
    if (task.status === 'completed') return 'Concluída';
    if (isTaskOverdue(task)) return 'Atrasada';
    if (task.status === 'in-progress') return 'Em Progresso';
    return 'Pendente';
}

// Verificar se a tarefa está atrasada
function isTaskOverdue(task) {
    return task.status !== 'completed' && new Date(task.endDate) < new Date();
}

// Inicializar a aplicação
init();