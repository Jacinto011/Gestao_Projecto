// Inicialização do sistema
        document.addEventListener('DOMContentLoaded', function() {
            // Verifica se é a primeira execução e cria o usuário admin
            initializeSystem();
            
            // Configura eventos
            setupEventListeners();
            
            // Verifica se há tarefas atrasadas
            checkOverdueTasks();
            
            // Verifica tarefas próximas do prazo
            checkUpcomingDeadlines();
        });

        // Estrutura de dados
        let data = {
            users: [],
            projects: [],
            tasks: [],
            currentUser: null
        };

        // Inicializa o sistema
        function initializeSystem() {
            const savedData = localStorage.getItem('projectManagementData');
            
            if (savedData) {
                data = JSON.parse(savedData);
            } else {
                // Cria o usuário administrador padrão
                data.users.push({
                    id: '1234',
                    name: 'Administrador',
                    isAdmin: true
                });
                
                saveData();
            }
        }

        // Salva os dados no localStorage
        function saveData() {
            localStorage.setItem('projectManagementData', JSON.stringify(data));
        }

        // Configura os event listeners
        function setupEventListeners() {
            // Login
            document.getElementById('loginBtn').addEventListener('click', handleLogin);
            document.getElementById('userIdInput').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') handleLogin();
            });

            // Tabs
            document.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', function() {
                    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                    
                    this.classList.add('active');
                    document.getElementById(`${this.dataset.tab}Tab`).classList.add('active');
                });
            });

            // Projetos
            document.getElementById('addProjectBtn').addEventListener('click', showAddProjectModal);
            document.querySelector('#projectModal .close').addEventListener('click', closeModal.bind(null, 'projectModal'));
            document.getElementById('projectForm').addEventListener('submit', handleProjectSubmit);

            // Tarefas
            document.querySelector('#taskModal .close').addEventListener('click', closeModal.bind(null, 'taskModal'));
            document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);
            document.getElementById('addTaskToProjectBtn').addEventListener('click', showAddTaskModal);

            // Membros
            document.getElementById('addMemberBtn').addEventListener('click', showAddMemberModal);
            document.querySelector('#memberModal .close').addEventListener('click', closeModal.bind(null, 'memberModal'));
            document.getElementById('memberForm').addEventListener('submit', handleMemberSubmit);

            // Modal de detalhes
            document.querySelector('#projectDetailModal .close').addEventListener('click', closeModal.bind(null, 'projectDetailModal'));

            // Modal de confirmação
            document.querySelector('#confirmModal .close').addEventListener('click', closeModal.bind(null, 'confirmModal'));
            document.getElementById('confirmCancelBtn').addEventListener('click', closeModal.bind(null, 'confirmModal'));
        }

        // Manipulação de login
        function handleLogin() {
            const userId = document.getElementById('userIdInput').value.trim();
            const user = data.users.find(u => u.id === userId);
            
            if (user) {
                data.currentUser = user;
                showMainScreen();
                loadProjects();
                loadUserTasks();
                loadTeamMembers();
            } else {
                alert('ID de colaborador não encontrado. Por favor, verifique o ID e tente novamente.');
            }
        }

        // Mostra a tela principal
        function showMainScreen() {
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('mainScreen').style.display = 'block';
            
            // Atualiza informações do usuário
            document.getElementById('userName').textContent = data.currentUser.name;
            document.getElementById('userId').textContent = `ID: ${data.currentUser.id}`;
            document.getElementById('userAvatar').textContent = data.currentUser.name.charAt(0).toUpperCase();
        }

        // Carrega projetos
        function loadProjects() {
            const tbody = document.getElementById('projectsTableBody');
            tbody.innerHTML = '';
            
            data.projects.forEach(project => {
                const projectTasks = data.tasks.filter(task => task.projectId === project.id);
                const completedTasks = projectTasks.filter(task => task.status === 'completed').length;
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${project.name}</td>
                    <td>${project.description || '-'}</td>
                    <td>${formatDate(project.startDate)}</td>
                    <td>${formatDate(project.endDate)}</td>
                    <td>${completedTasks}/${projectTasks.length} concluídas</td>
                    <td>
                        <button class="btn btn-primary btn-sm view-project" data-id="${project.id}">Ver</button>
                        ${data.currentUser.isAdmin ? `
                            <button class="btn btn-outline btn-sm edit-project" data-id="${project.id}">Editar</button>
                            <button class="btn btn-danger btn-sm delete-project" data-id="${project.id}">Excluir</button>
                        ` : ''}
                    </td>
                `;
                
                tbody.appendChild(row);
            });
            
            // Adiciona eventos aos botões
            document.querySelectorAll('.view-project').forEach(btn => {
                btn.addEventListener('click', function() {
                    showProjectDetails(this.dataset.id);
                });
            });
            
            document.querySelectorAll('.edit-project').forEach(btn => {
                btn.addEventListener('click', function() {
                    showEditProjectModal(this.dataset.id);
                });
            });
            
            document.querySelectorAll('.delete-project').forEach(btn => {
                btn.addEventListener('click', function() {
                    showConfirmModal(
                        'Excluir Projeto',
                        'Tem certeza que deseja excluir este projeto e todas as suas tarefas?',
                        () => deleteProject(this.dataset.id)
                    );
                });
            });
        }

        // Mostra modal de adicionar projeto
        function showAddProjectModal() {
            document.getElementById('projectModalTitle').textContent = 'Adicionar Novo Projeto';
            document.getElementById('projectForm').reset();
            document.getElementById('projectId').value = '';
            openModal('projectModal');
        }

        // Mostra modal de editar projeto
        function showEditProjectModal(projectId) {
            const project = data.projects.find(p => p.id === projectId);
            
            if (project) {
                document.getElementById('projectModalTitle').textContent = 'Editar Projeto';
                document.getElementById('projectId').value = project.id;
                document.getElementById('projectName').value = project.name;
                document.getElementById('projectDescription').value = project.description || '';
                document.getElementById('projectStartDate').value = project.startDate;
                document.getElementById('projectEndDate').value = project.endDate;
                
                openModal('projectModal');
            }
        }

        // Manipula o envio do formulário de projeto
        function handleProjectSubmit(e) {
            e.preventDefault();
            
            const projectId = document.getElementById('projectId').value;
            const projectData = {
                name: document.getElementById('projectName').value,
                description: document.getElementById('projectDescription').value,
                startDate: document.getElementById('projectStartDate').value,
                endDate: document.getElementById('projectEndDate').value
            };
            
            if (projectId) {
                // Editar projeto existente
                const index = data.projects.findIndex(p => p.id === projectId);
                if (index !== -1) {
                    data.projects[index] = { ...data.projects[index], ...projectData };
                }
            } else {
                // Adicionar novo projeto
                projectData.id = generateId();
                projectData.createdBy = data.currentUser.id;
                projectData.createdAt = new Date().toISOString();
                data.projects.push(projectData);
            }
            
            saveData();
            loadProjects();
            closeModal('projectModal');
        }

        // Exclui um projeto
        function deleteProject(projectId) {
            // Remove todas as tarefas associadas ao projeto
            data.tasks = data.tasks.filter(task => task.projectId !== projectId);
            
            // Remove o projeto
            data.projects = data.projects.filter(project => project.id !== projectId);
            
            saveData();
            loadProjects();
            loadUserTasks();
            closeModal('confirmModal');
        }

        // Mostra detalhes do projeto
        function showProjectDetails(projectId) {
            const project = data.projects.find(p => p.id === projectId);
            
            if (project) {
                document.getElementById('detailProjectName').textContent = project.name;
                document.getElementById('detailProjectDescription').textContent = project.description || 'Sem descrição';
                document.getElementById('detailProjectPeriod').textContent = 
                    `${formatDate(project.startDate)} a ${formatDate(project.endDate)}`;
                
                // Carrega tarefas do projeto
                const tasks = data.tasks.filter(task => task.projectId === projectId);
                const tbody = document.getElementById('projectTasksTableBody');
                tbody.innerHTML = '';
                
                tasks.forEach(task => {
                    const assignee = data.users.find(u => u.id === task.assignee);
                    const assigneeName = assignee ? assignee.name : 'Não atribuído';
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${task.name}</td>
                        <td>${task.description || '-'}</td>
                        <td>${assigneeName}</td>
                        <td>${formatDate(task.endDate)}</td>
                        <td><span class="badge ${getStatusBadgeClass(task.status)}">${getStatusText(task.status)}</span></td>
                        <td>
                            <button class="btn btn-primary btn-sm edit-task" data-id="${task.id}">Editar</button>
                            <button class="btn btn-danger btn-sm delete-task" data-id="${task.id}">Excluir</button>
                            ${task.status !== 'completed' ? 
                                `<button class="btn btn-success btn-sm complete-task" data-id="${task.id}">Concluir</button>` : ''}
                        </td>
                    `;
                    
                    tbody.appendChild(row);
                });
                
                // Adiciona eventos aos botões
                document.querySelectorAll('.edit-task').forEach(btn => {
                    btn.addEventListener('click', function() {
                        showEditTaskModal(this.dataset.id);
                    });
                });
                
                document.querySelectorAll('.delete-task').forEach(btn => {
                    btn.addEventListener('click', function() {
                        showConfirmModal(
                            'Excluir Tarefa',
                            'Tem certeza que deseja excluir esta tarefa?',
                            () => deleteTask(this.dataset.id)
                        );
                    });
                });
                
                document.querySelectorAll('.complete-task').forEach(btn => {
                    btn.addEventListener('click', function() {
                        completeTask(this.dataset.id);
                    });
                });
                
                // Atualiza o botão de adicionar tarefa
                document.getElementById('addTaskToProjectBtn').dataset.projectId = projectId;
                
                // Renderiza o diagrama de Gantt
                renderGanttChart(projectId);
                
                openModal('projectDetailModal');
            }
        }

        // Renderiza o diagrama de Gantt
        function renderGanttChart(projectId) {
            const project = data.projects.find(p => p.id === projectId);
            const tasks = data.tasks.filter(task => task.projectId === projectId);
            
            if (!project || tasks.length === 0) {
                document.getElementById('ganttChart').innerHTML = '<p>Não há tarefas para exibir no diagrama.</p>';
                return;
            }
            
            // Calcula o período total do projeto
            const startDate = new Date(project.startDate);
            const endDate = new Date(project.endDate);
            const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            
            // Cria o cabeçalho do Gantt
            let ganttHTML = '<div class="gantt-header">';
            ganttHTML += '<div class="gantt-header-item" style="min-width: 200px;">Tarefa</div>';
            
            for (let i = 0; i < totalDays; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                ganttHTML += `<div class="gantt-header-item">${date.getDate()}/${date.getMonth() + 1}</div>`;
            }
            
            ganttHTML += '</div>';
            
            // Adiciona as linhas das tarefas
            tasks.forEach(task => {
                const taskStartDate = new Date(task.startDate);
                const taskEndDate = new Date(task.endDate);
                
                const startOffset = Math.ceil((taskStartDate - startDate) / (1000 * 60 * 60 * 24));
                const taskDays = Math.ceil((taskEndDate - taskStartDate) / (1000 * 60 * 60 * 24)) + 1;
                
                ganttHTML += '<div class="gantt-row">';
                ganttHTML += `<div class="gantt-row-label">${task.name}</div>`;
                ganttHTML += '<div class="gantt-row-bars">';
                ganttHTML += `<div class="gantt-bar" style="left: ${(startOffset * 100) + 200}px; width: ${taskDays * 100}px;"></div>`;
                ganttHTML += '</div></div>';
            });
            
            document.getElementById('ganttChart').innerHTML = ganttHTML;
        }

        // Carrega tarefas do usuário logado
        function loadUserTasks() {
            const tbody = document.getElementById('tasksTableBody');
            tbody.innerHTML = '';
            
            const userTasks = data.tasks.filter(task => task.assignee === data.currentUser.id);
            
            userTasks.forEach(task => {
                const project = data.projects.find(p => p.id === task.projectId);
                const projectName = project ? project.name : 'Projeto não encontrado';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${projectName}</td>
                    <td>${task.name}</td>
                    <td>${task.description || '-'}</td>
                    <td>${formatDate(task.endDate)}</td>
                    <td><span class="badge ${getStatusBadgeClass(task.status)}">${getStatusText(task.status)}</span></td>
                    <td>
                        <button class="btn btn-primary btn-sm edit-task" data-id="${task.id}">Editar</button>
                        ${task.status !== 'completed' ? 
                            `<button class="btn btn-success btn-sm complete-task" data-id="${task.id}">Concluir</button>` : ''}
                    </td>
                `;
                
                tbody.appendChild(row);
            });
            
            // Adiciona eventos aos botões
            document.querySelectorAll('.edit-task').forEach(btn => {
                btn.addEventListener('click', function() {
                    showEditTaskModal(this.dataset.id);
                });
            });
            
            document.querySelectorAll('.complete-task').forEach(btn => {
                btn.addEventListener('click', function() {
                    completeTask(this.dataset.id);
                });
            });
        }

        // Mostra modal de adicionar tarefa
        function showAddTaskModal() {
            const projectId = this.dataset.projectId;
            
            document.getElementById('taskModalTitle').textContent = 'Adicionar Nova Tarefa';
            document.getElementById('taskForm').reset();
            document.getElementById('taskId').value = '';
            document.getElementById('taskProjectId').value = projectId;
            
            // Preenche o select de responsáveis
            const assigneeSelect = document.getElementById('taskAssignee');
            assigneeSelect.innerHTML = '';
            
            data.users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.name;
                assigneeSelect.appendChild(option);
            });
            
            // Define a data de início como hoje e término como hoje + 7 dias
            const today = new Date().toISOString().split('T')[0];
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            const nextWeekStr = nextWeek.toISOString().split('T')[0];
            
            document.getElementById('taskStartDate').value = today;
            document.getElementById('taskEndDate').value = nextWeekStr;
            
            openModal('taskModal');
        }

        // Mostra modal de editar tarefa
        function showEditTaskModal(taskId) {
            const task = data.tasks.find(t => t.id === taskId);
            
            if (task) {
                document.getElementById('taskModalTitle').textContent = 'Editar Tarefa';
                document.getElementById('taskId').value = task.id;
                document.getElementById('taskProjectId').value = task.projectId;
                document.getElementById('taskName').value = task.name;
                document.getElementById('taskDescription').value = task.description || '';
                document.getElementById('taskStartDate').value = task.startDate;
                document.getElementById('taskEndDate').value = task.endDate;
                document.getElementById('taskStatus').value = task.status;
                
                // Preenche o select de responsáveis
                const assigneeSelect = document.getElementById('taskAssignee');
                assigneeSelect.innerHTML = '';
                
                data.users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = user.name;
                    if (user.id === task.assignee) option.selected = true;
                    assigneeSelect.appendChild(option);
                });
                
                openModal('taskModal');
            }
        }

        // Manipula o envio do formulário de tarefa
        function handleTaskSubmit(e) {
            e.preventDefault();
            
            const taskId = document.getElementById('taskId').value;
            const projectId = document.getElementById('taskProjectId').value;
            const taskData = {
                name: document.getElementById('taskName').value,
                description: document.getElementById('taskDescription').value,
                startDate: document.getElementById('taskStartDate').value,
                endDate: document.getElementById('taskEndDate').value,
                assignee: document.getElementById('taskAssignee').value,
                status: document.getElementById('taskStatus').value,
                projectId: projectId
            };
            
            if (taskId) {
                // Editar tarefa existente
                const index = data.tasks.findIndex(t => t.id === taskId);
                if (index !== -1) {
                    data.tasks[index] = { ...data.tasks[index], ...taskData };
                }
            } else {
                // Adicionar nova tarefa
                taskData.id = generateId();
                taskData.createdBy = data.currentUser.id;
                taskData.createdAt = new Date().toISOString();
                data.tasks.push(taskData);
            }
            
            saveData();
            loadProjects();
            loadUserTasks();
            
            // Recarrega as tarefas do projeto se estivermos na modal de detalhes
            if (document.getElementById('projectDetailModal').style.display === 'flex') {
                showProjectDetails(projectId);
            }
            
            closeModal('taskModal');
        }

        // Conclui uma tarefa
        function completeTask(taskId) {
            const task = data.tasks.find(t => t.id === taskId);
            
            if (task) {
                task.status = 'completed';
                saveData();
                loadUserTasks();
                
                // Recarrega as tarefas do projeto se estivermos na modal de detalhes
                if (document.getElementById('projectDetailModal').style.display === 'flex') {
                    showProjectDetails(task.projectId);
                }
            }
        }

        // Exclui uma tarefa
        function deleteTask(taskId) {
            data.tasks = data.tasks.filter(task => task.id !== taskId);
            saveData();
            loadUserTasks();
            
            // Recarrega as tarefas do projeto se estivermos na modal de detalhes
            const task = data.tasks.find(t => t.id === taskId);
            if (task && document.getElementById('projectDetailModal').style.display === 'flex') {
                showProjectDetails(task.projectId);
            }
            
            closeModal('confirmModal');
        }

        // Carrega membros da equipe
        function loadTeamMembers() {
            const tbody = document.getElementById('teamTableBody');
            tbody.innerHTML = '';
            
            data.users.forEach(user => {
                const userTasks = data.tasks.filter(task => task.assignee === user.id);
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.name}</td>
                    <td>${userTasks.length}</td>
                    <td>
                        ${user.id !== data.currentUser.id && data.currentUser.isAdmin ? 
                            `<button class="btn btn-danger btn-sm delete-member" data-id="${user.id}">Excluir</button>` : 
                            '<span class="text-muted">-</span>'}
                    </td>
                `;
                
                tbody.appendChild(row);
            });
            
            // Adiciona eventos aos botões de excluir
            document.querySelectorAll('.delete-member').forEach(btn => {
                btn.addEventListener('click', function() {
                    showConfirmModal(
                        'Excluir Membro',
                        'Tem certeza que deseja excluir este membro da equipe?',
                        () => deleteMember(this.dataset.id)
                    );
                });
            });
        }

        // Mostra modal de adicionar membro
        function showAddMemberModal() {
            document.getElementById('memberModalTitle').textContent = 'Adicionar Novo Membro';
            document.getElementById('memberForm').reset();
            document.getElementById('memberId').value = '';
            openModal('memberModal');
        }

        // Manipula o envio do formulário de membro
        function handleMemberSubmit(e) {
            e.preventDefault();
            
            const memberId = document.getElementById('memberId').value;
            const memberData = {
                id: document.getElementById('memberIdInput').value,
                name: document.getElementById('memberName').value,
                isAdmin: false
            };
            
            if (memberId) {
                // Editar membro existente (não implementado neste exemplo)
            } else {
                // Verifica se o ID já existe
                if (data.users.some(u => u.id === memberData.id)) {
                    alert('Já existe um membro com este ID. Por favor, use um ID diferente.');
                    return;
                }
                
                // Adicionar novo membro
                data.users.push(memberData);
            }
            
            saveData();
            loadTeamMembers();
            closeModal('memberModal');
        }

        // Exclui um membro
        function deleteMember(memberId) {
            // Não permite excluir o administrador padrão
            if (memberId === '1234') {
                alert('Não é possível excluir o administrador padrão.');
                return;
            }
            
            // Remove o membro
            data.users = data.users.filter(user => user.id !== memberId);
            
            // Atualiza as tarefas atribuídas a este membro para não atribuídas
            data.tasks.forEach(task => {
                if (task.assignee === memberId) {
                    task.assignee = '';
                }
            });
            
            saveData();
            loadTeamMembers();
            loadUserTasks();
            
            // Recarrega as tarefas do projeto se estivermos na modal de detalhes
            if (document.getElementById('projectDetailModal').style.display === 'flex') {
                const projectId = document.getElementById('addTaskToProjectBtn').dataset.projectId;
                showProjectDetails(projectId);
            }
            
            closeModal('confirmModal');
        }

        // Verifica tarefas atrasadas
        function checkOverdueTasks() {
            const today = new Date().toISOString().split('T')[0];
            const overdueTasks = data.tasks.filter(task => 
                task.status !== 'completed' && task.endDate < today
            );
            
            if (overdueTasks.length > 0 && data.currentUser) {
                const alertDiv = document.createElement('div');
                alertDiv.className = 'alert alert-danger';
                alertDiv.innerHTML = `
                    <strong>Atenção!</strong> Existem ${overdueTasks.length} tarefas atrasadas.
                    <a href="#" id="viewOverdueTasks">Ver tarefas</a>
                `;
                
                document.getElementById('alertsContainer').appendChild(alertDiv);
                
                document.getElementById('viewOverdueTasks').addEventListener('click', function(e) {
                    e.preventDefault();
                    document.querySelector('.tab[data-tab="tasks"]').click();
                });
            }
        }

        // Verifica tarefas próximas do prazo
        function checkUpcomingDeadlines() {
            const today = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(today.getDate() + 7);
            
            const upcomingTasks = data.tasks.filter(task => {
                if (task.status === 'completed') return false;
                
                const taskDate = new Date(task.endDate);
                return taskDate >= today && taskDate <= nextWeek;
            });
            
            if (upcomingTasks.length > 0 && data.currentUser) {
                const alertDiv = document.createElement('div');
                alertDiv.className = 'alert alert-warning';
                alertDiv.innerHTML = `
                    <strong>Atenção!</strong> Existem ${upcomingTasks.length} tarefas com prazo próximo.
                    <a href="#" id="viewUpcomingTasks">Ver tarefas</a>
                `;
                
                document.getElementById('alertsContainer').appendChild(alertDiv);
                
                document.getElementById('viewUpcomingTasks').addEventListener('click', function(e) {
                    e.preventDefault();
                    document.querySelector('.tab[data-tab="tasks"]').click();
                });
            }
        }

        // Mostra modal de confirmação
        function showConfirmModal(title, message, callback) {
            document.getElementById('confirmModalTitle').textContent = title;
            document.getElementById('confirmModalMessage').textContent = message;
            document.getElementById('confirmActionBtn').onclick = callback;
            openModal('confirmModal');
        }

        // Abre um modal
        function openModal(modalId) {
            document.getElementById(modalId).style.display = 'flex';
        }

        // Fecha um modal
        function closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }

        // Gera um ID único
        function generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }

        // Formata data para exibição
        function formatDate(dateString) {
            if (!dateString) return '-';
            
            const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
            return new Date(dateString).toLocaleDateString('pt-BR', options);
        }

        // Retorna a classe CSS para o status
        function getStatusBadgeClass(status) {
            switch (status) {
                case 'completed': return 'badge-success';
                case 'in_progress': return 'badge-primary';
                case 'pending': return 'badge-warning';
                default: return 'badge-secondary';
            }
        }

        // Retorna o texto para o status
        function getStatusText(status) {
            switch (status) {
                case 'completed': return 'Concluído';
                case 'in_progress': return 'Em Progresso';
                case 'pending': return 'Pendente';
                default: return status;
            }
        }