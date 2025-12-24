import * as React from 'react';
import { useState, useEffect } from 'react';
import { User as UserIcon, CheckSquare } from 'lucide-react';
import { User, Request, Task, TaskPriority, TaskStatus } from '../../assetManagementPortal/types';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: Request;
    adminUsers: User[];
    onCreateTask: (task: Task) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, request, adminUsers, onCreateTask }) => {
    const [assignedToId, setAssignedToId] = useState<string>('');
    const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
    const [dueDate, setDueDate] = useState<string>('');
    const [description, setDescription] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            // Default due date to 3 days from now
            const d = new Date();
            d.setDate(d.getDate() + 3);
            setDueDate(d.toISOString().split('T')[0]);
            setDescription(`Fulfillment required for ${request.type}: ${request.item}.\nRequested by: ${request.requestedBy.fullName}`);

            // Default to first admin if available
            if (adminUsers.length > 0) {
                setAssignedToId(String(adminUsers[0].id));
            }
        }
    }, [isOpen, request, adminUsers]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const assignedUser = adminUsers.find(u => String(u.id) === assignedToId) || null;

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
        <div className="modal fade show d-block bg-dark bg-opacity-50" tabIndex={-1} role="dialog" onClick={onClose}>
            <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
                <div className="modal-content shadow-lg">

                    <div className="modal-header bg-light border-bottom">
                        <div className="d-flex align-items-center gap-2">
                            <div className="bg-primary-subtle p-2 rounded text-primary">
                                <CheckSquare size={20} />
                            </div>
                            <h5 className="modal-title fw-bold">Approve & Create Task</h5>
                        </div>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="modal-body p-4">
                            {/* Request Context Summary */}
                            <div className="alert alert-primary d-flex flex-column gap-1 py-2 px-3 mb-4 border-0 bg-primary-subtle text-primary-emphasis">
                                <div className="d-flex justify-content-between align-items-start w-100">
                                    <small className="fw-bold">Request Context:</small>
                                    <span className="badge bg-primary text-white" style={{ fontSize: '10px' }}>{request.type}</span>
                                </div>
                                <div className="fw-medium">{request.item}</div>
                                <small className="opacity-75">Requested by {request.requestedBy.fullName} on {request.requestDate}</small>
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-bold">Assign To (Admin)</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-white"><UserIcon size={16} className="text-muted" /></span>
                                    <select
                                        value={assignedToId}
                                        onChange={(e) => setAssignedToId(e.target.value)}
                                        className="form-select"
                                        required
                                    >
                                        {adminUsers.map(u => (
                                            <option key={u.id} value={u.id}>{u.fullName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="row g-3 mb-3">
                                <div className="col-6">
                                    <label className="form-label small fw-bold">Priority</label>
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
                                    <label className="form-label small fw-bold">Due Date</label>
                                    <div className="input-group">
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            className="form-control"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-bold">Task Description / Instructions</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={4}
                                    className="form-control"
                                    placeholder="E.g. Verify stock, order from vendor, configure device..."
                                />
                            </div>
                        </div>

                        <div className="modal-footer bg-light border-top-0">
                            <button type="button" onClick={onClose} className="btn btn-light border">
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary d-flex align-items-center gap-2">
                                <CheckSquare size={16} /> Confirm Approval
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TaskModal;