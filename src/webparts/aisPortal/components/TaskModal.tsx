
import React, { useState, useEffect } from 'react';
import { User as UserIcon, CheckSquare } from 'lucide-react';
import { User, Request, Task, TaskPriority, TaskStatus } from '../types';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: Request;
    adminUsers: User[];
    allUsers?: User[];
    onCreateTask: (task: Task) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, request, adminUsers, allUsers = [], onCreateTask }) => {
    const [assignedToId, setAssignedToId] = useState<string>('');
    const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
    const [dueDate, setDueDate] = useState<string>('');
    const [description, setDescription] = useState<string>('');

    const availableUsers = adminUsers.length > 0 ? adminUsers : allUsers;

    useEffect(() => {
        if (isOpen) {
            // Default due date to 3 days from now
            const d = new Date();
            d.setDate(d.getDate() + 3);
            setDueDate(d.toISOString().split('T')[0]);
            setDescription(`Fulfillment required for ${request.type}: ${request.item}.\nRequested by: ${request.requestedBy.fullName}`);

            // Default to first user if available
            if (availableUsers.length > 0) {
                setAssignedToId(String(availableUsers[0].id));
            }
        }
    }, [isOpen, request, adminUsers, allUsers]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const assignedUser = availableUsers.find(u => String(u.id) === assignedToId) || undefined;

        const newTask: Task = {
            id: `task-${Date.now()}`,
            requestId: request.id,
            title: `Fulfill: ${request.item}`,
            assignedTo: assignedUser,
            status: TaskStatus.TODO,
            priority: priority,
            dueDate: dueDate,
            description: description,
            createdDate: new Date().toISOString()
        };

        onCreateTask(newTask);
    };

    if (!isOpen) return null;

    return (
        <>
            {isOpen && <div className="modal-backdrop fade show"></div>}
            <div className={`modal fade ${isOpen ? 'show d-block' : ''}`} tabIndex={-1} aria-hidden={!isOpen} onClick={onClose}>
                <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
                    <div className="modal-content shadow-lg">

                        <div className="modal-header border-bottom bg-light">
                            <div className="d-flex align-items-center gap-2">
                                <div className="bg-primary-subtle p-2 rounded text-primary">
                                    <CheckSquare size={20} />
                                </div>
                                <h5 className="modal-title fw-semibold text-dark">Approve & Create Task</h5>
                            </div>
                            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                        </div>

                        <div className="modal-body p-4">
                            <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                                {/* Request Context Summary */}
                                <div className="alert alert-primary d-flex flex-column gap-1 mb-0 border-primary-subtle bg-primary-subtle text-primary-emphasis">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <span className="fw-semibold small">Request Context:</span>
                                        <span className="badge bg-primary-subtle border border-primary text-primary text-uppercase">{request.type}</span>
                                    </div>
                                    <p className="mb-0 small fw-medium">{request.item}</p>
                                    <p className="small mb-0 opacity-75">Requested by {request.requestedBy.fullName} on {request.requestDate}</p>
                                </div>

                                <div>
                                    <label className="form-label small fw-medium text-secondary">Assign To {adminUsers.length === 0 ? '(All Users)' : '(Admin)'}</label>
                                    <div className="position-relative">
                                        <UserIcon className="position-absolute top-50 translate-middle-y text-secondary" style={{ left: '10px', width: '16px', height: '16px' }} />
                                        <select
                                            value={assignedToId}
                                            onChange={(e) => setAssignedToId(e.target.value)}
                                            className="form-select ps-5"
                                            required
                                        >
                                            {availableUsers.map(u => (
                                                <option key={u.id} value={u.id}>{u.fullName}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="row g-3">
                                    <div className="col-6">
                                        <label className="form-label small fw-medium text-secondary">Priority</label>
                                        <select
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value as TaskPriority)}
                                            className="form-select"
                                        >
                                            <option value={TaskPriority.HIGH}>High</option>
                                            <option value={TaskPriority.MEDIUM}>Medium</option>
                                            <option value={TaskPriority.LOW}>Low</option>
                                        </select>
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label small fw-medium text-secondary">Due Date</label>
                                        <div className="position-relative">
                                            <input
                                                type="date"
                                                value={dueDate}
                                                onChange={(e) => setDueDate(e.target.value)}
                                                className="form-control"
                                                required
                                            />
                                            {/* Calendar icon omitted as native date picker has icon, or position absolute it */}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="form-label small fw-medium text-secondary">Task Description / Instructions</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={4}
                                        className="form-control"
                                        placeholder="E.g. Verify stock, order from vendor, configure device..."
                                    />
                                </div>

                                <div className="d-flex justify-content-end gap-2 mt-2">
                                    <button type="button" onClick={onClose} className="btn btn-light border text-secondary fw-medium">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary fw-medium d-flex align-items-center gap-2 shadow-sm">
                                        <CheckSquare size={16} /> Confirm Approval
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TaskModal;
