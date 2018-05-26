(function($){


	$(document).ready(function(){

		var todos = (function() {
			var list = [];
			var priorities = {
				0: 'Niski',
				1: 'Normalny',
				2: 'Wysoki'
			};
			var sortSettings = {
				propertyName: 'createdAt',
				order: 'desc'
			};
			var renderEngine = null;

			var setRenderEngine = function (newRenderEngine) {
				renderEngine = newRenderEngine;
			};

			var getPriorityName = function (priority) {
				if (typeof priorities[priority] !== 'undefined') {
					return priorities[priority];
				}

				return null;
			};

			var generateId = function () {
				var newId;

				do {
					newId = Math.floor(Math.random() * 99999) + 10000;
				} while (null !== get(newId));
				
				return newId;
			};

			var add = function (name, priority, deadline) {
				deadline = deadline||null;

				var id = generateId();

				list.push({
					id: id,
					name: name,
					priority: priority,
					createdAt: new Date(),
					deadline: deadline,
					done: false,
					doneAt: null
				});

				doSort();
				rerenderList();

				return id;
			};

			var get = function (id) {
				var i, j, taskFound;
				j = list.length;

				for(i=0; i<j; i++) {
					if (list[i].id === id) {
						taskFound = $.extend(true, {}, list[i]);
						taskFound.priorityName = getPriorityName(taskFound.priority);

						return taskFound;
					}
				}

				return null;
			};

			var getIndex = function (id) {
				var i, j;
				j = list.length;

				for(i=0; i<j; i++) {
					if (list[i].id === id) {
						return i;
					}
				}

				return null;
			};

			var getAll = function () {
				var newList = [];
				list.forEach(function (task) {
					newList.push(get(task.id));
				});

				return newList;
			};

			var remove = function (id) {
				var index = getIndex(id);

				if (null !== index) {
					list.splice(index, 1);

					if (null !== renderEngine) {
						renderEngine.removeTask(id);
					}
				}
			};

			var makeTaskStatus = function (id, status) {
				var task = get(id);

				if (null !== task) {
					task.done = status;

					if (status) {
						task.doneAt = new Date();
					}

					doSort();
					rerenderList();
				}
			}

			var makeDone = function (id) {
				makeTaskStatus(id, true);
			};

			var makeUndone = function (id) {
				makeTaskStatus(id, false);
			};

			var doSort = function () {
				var propertyName = sortSettings.propertyName;
				var order = sortSettings.order;

				var normalizeDate = function (date) {
					if (null == date) {
						return 0;
					}

					return date.getTime();
				};

				var normalize = {
					'deadline': normalizeDate,
					'createdAt': normalizeDate 
				};


				list = list.sort(function (a, b) {
					var aValue = a[propertyName];
					var bValue = b[propertyName];

					if (typeof normalize[propertyName] !== 'undefined') {
						aValue = normalize[propertyName](aValue);
						bValue = normalize[propertyName](bValue);
					}

					if (aValue == bValue) {
						return 0;
					}

					if ('desc' == order) {
						return aValue < bValue;
					} else {
						return aValue > bValue;
					}
				});
			};

			var sort = function (propertyName, order) {
				sortSettings.propertyName = propertyName;
				sortSettings.order = order;

				doSort();
				rerenderList();
			};

			var rerenderList = function () {
				if (null !== renderEngine) {
					renderEngine.rerender(getAll());
				}
			};

			var getSortSettings = function () {
				return $.extend({}, sortSettings);
			};

			return {
				setRenderEngine: setRenderEngine,
				add: add,
				remove: remove,
				makeDone: makeDone,
				makeUndone: makeUndone,
				getAll: getAll,
				sort: sort,
				getSortSettings: getSortSettings
			};
		})();

		var todosRenderEngine = (function () {
			var $container = null;

			var setContainer = function (selector) {
				$container = $(selector);
			};

			var formatDate = function (date) {
				return date.getDate() + '.' + (date.getMonth()+1) + '.' + date.getFullYear();
			};

			var createTaskNode = function (task) {
				var node;

				var prioritiesStyles = {
					0: 'secondary',
					1: 'primary',
					2: 'danger'
				};

				var statusName = task.done ? 'done' : 'undone';

				node = '<li class="list-group-item" data-task-id="'+task.id+'">';

				if (task.done) {
					node += '<input class="done-ctrl js--task-change-status" type="checkbox" checked data-task-id="'+task.id+'">' +
                                '<span class="task-name task-status-done">'+task.name+'</span>' + 
                                '<span class="task-done-date">' + formatDate(task.doneAt) + '</span>';
				} else {
					node += '<input class="done-ctrl js--task-change-status" type="checkbox" data-task-id="'+task.id+'">' +
                                '<span class="task-name task-status-undone">'+task.name+'</span>';
				}

				node += '<span class="badge badge-'+prioritiesStyles[task.priority]+' priority-name">'+task.priorityName+'</span>' + 
                    	'<button class="btn btn-danger btn-sm float-right js--delete-task-btn" data-task-id="'+task.id+'">X</button>';

            	node += '<span class="badge badge-secondary float-right">Data utworzenia: <span class="create-ad">' + formatDate(task.createdAt) + '</span></span>';

            	if (null !== task.deadline) {
            		node += '<span class="badge badge-dark float-right">Deadline: <span class="deadline">' + formatDate(task.deadline) + '</span></span>';
            	}

            	node += '</li>';

        		return node;
			};

			var renderTask = function (task) {
				var taskNode = createTaskNode(task);

				$container.append(taskNode);
			};

			var findTaskNode = function (id) {
				return $container.find('[data-task-id="'+id+'"]');
			};

			var removeTask = function (id) {
				var $taskNode = findTaskNode(id);

				$taskNode.remove();
			};

			var updateTask = function (task) {
				var taskNode = createTaskNode(task);

				var $currentTaskNode = findTaskNode(task.id);
				$currentTaskNode.replaceWith(taskNode);
			};

			var rerender = function (tasks) {
				$container.empty();

				tasks.forEach(function (task) {
					renderTask(task);
				});
			};

			return {
				setContainer: setContainer,
				renderTask: renderTask,
				removeTask: removeTask,
				updateTask: updateTask,
				rerender: rerender
			};
		})();

		todosRenderEngine.setContainer('.js--todos-container');

		todos.setRenderEngine(todosRenderEngine);

		todos.add('Przygotuj materiał na szkolenie', 0, new Date(2018, 9, 15));

		todos.add('Stworzyć brief aplikacji', 1);

		todos.add('Zaprojektować layout', 2);

		todos.add('Wyszukać komponenty', 0);

		todos.add('Zaprogramować logikę', 2);

		$('.js--add-task-form').submit(function (evt) {
			evt.preventDefault();

			var convertDateStrToDate = function (dateString) {
				var dateParts = dateString.split('-');
				return new Date(dateParts[0], dateParts[1], dateParts[2]);
			};

			var $form = $(this);
			var formData = {};

			$form.serializeArray().forEach(function (obj, key) {
				formData[obj.name] = $.trim(obj.value);
			});

			if (formData.taskName.length > 0) {
				if (0 == formData.date.length) {
					formData.date = null;
				} else {
					formData.date = convertDateStrToDate(formData.date);
				}

				todos.add(formData.taskName, formData.priority, formData.date)

				$form.find(':input').val('');
				$form.find('select').val(1);
			}
		});

		$('.js--todos-container').on('click', '.js--delete-task-btn', function () {
			var $this = $(this);
			var taskId = parseInt($this.attr('data-task-id'));

			todos.remove(taskId);
		});

		$('.js--todos-container').on('change', '.js--task-change-status', function () {
			var $this = $(this);
			var isDone = $this.is(':checked');
			var taskId = parseInt($this.attr('data-task-id'));

			if (isDone) {
				todos.makeDone(taskId);
			} else {
				todos.makeUndone(taskId);
			}
		});

		$('.js--sort').on('change', function () {
			var $this = $(this);
			var value = $this.val();
			var orderDetails = value.split('-');

			todos.sort(orderDetails[0], orderDetails[1]);
		});

		var setupInitSortOption = function () {
			var activeSortSettings = todos.getSortSettings();
			var activeSortSettingsSelectValue = activeSortSettings.propertyName + '-' + activeSortSettings.order;
			$('.js--sort').val(activeSortSettingsSelectValue);
		};

		setupInitSortOption();
	});

})(jQuery);