import React, { useState } from 'react';
import { Edit2, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Train } from '../../types';
import { deleteTrain } from '../../services/trainService';
import { Table, Column } from '../ui/Table';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

export interface TrainListTableProps {
  trains: Train[];
  onEditTrain: (train: Train) => void;
  onRefresh: () => void;
}

export const TrainListTable: React.FC<TrainListTableProps> = ({
  trains,
  onEditTrain,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [trainToDelete, setTrainToDelete] = useState<Train | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredTrains = trains.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.number.includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.sourceStation.toLowerCase().includes(q) ||
      t.destStation.toLowerCase().includes(q)
    );
  });

  const handleDelete = async () => {
    if (!trainToDelete) return;
    setIsDeleting(true);
    const toastId = toast.loading(`Deleting train ${trainToDelete.number}...`);
    try {
      const res = await deleteTrain(trainToDelete.id);
      if (res.success) {
        toast.success('Train deleted from system', { id: toastId });
        setTrainToDelete(null);
        onRefresh();
      } else {
        toast.error('Failed to delete train', { id: toastId });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Train>[] = [
    {
      header: 'Train Number & Name',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-primary-600 dark:text-primary-400">
            #{row.number}
          </span>
          <p className="font-bold text-slate-900 dark:text-white">{row.name}</p>
        </div>
      ),
    },
    {
      header: 'Category',
      render: (row) => <Badge variant="default">{row.type}</Badge>,
    },
    {
      header: 'Route & Halts',
      render: (row) => (
        <div className="text-xs">
          <p className="font-bold text-slate-800 dark:text-slate-200">
            {row.sourceStation} → {row.destStation}
          </p>
          <p className="text-slate-400">{row.stops.length} halts scheduled</p>
        </div>
      ),
    },
    {
      header: 'Classes',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {Object.keys(row.classes).map((c) => (
            <span
              key={c}
              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              {c}
            </span>
          ))}
        </div>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditTrain(row)}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setTrainToDelete(row)}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search train no, name or station..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <span className="text-xs text-slate-400 font-semibold shrink-0">
          Total Trains: {filteredTrains.length}
        </span>
      </div>

      <Table<Train>
        columns={columns}
        data={filteredTrains}
        keyExtractor={(row) => row.id}
        emptyMessage="No trains found matching the search criteria"
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!trainToDelete}
        onClose={() => setTrainToDelete(null)}
        title="Delete Train Route?"
        description={
          trainToDelete
            ? `Are you sure you want to permanently delete Train #${trainToDelete.number} - ${trainToDelete.name}? It will no longer appear in search results.`
            : ''
        }
      >
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button variant="outline" size="md" onClick={() => setTrainToDelete(null)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" size="md" onClick={handleDelete} isLoading={isDeleting}>
            Yes, Delete Route
          </Button>
        </div>
      </Modal>
    </div>
  );
};
