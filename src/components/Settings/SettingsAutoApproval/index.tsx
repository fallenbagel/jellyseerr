import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import Header from '@app/components/Common/Header';
import RuleModal from '@app/components/Settings/SettingsAutoApproval/RuleModal';
import defineMessages from '@app/utils/defineMessages';
import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/solid';
import type { AutoApprovalRule } from '@server/lib/autoapproval';
import { useState } from 'react';
import useSWR from 'swr';

export const messages = defineMessages('components.ApprovalRuleList', {
  autoapprovalrules: 'Auto Approval Rules',
  addRule: 'Add Approval Rule',
});

interface ApprovalRuleInstanceProps {
  name: string;
  currentRule: AutoApprovalRule;
  onEdit: () => void;
}

const ApprovalRuleInstance = ({
  name,
  currentRule,
  onEdit,
}: ApprovalRuleInstanceProps) => {
  const conditionBadges = currentRule.conditions.map((condition) => (
    <Badge key={`auto-approval-badge-`} className="m-0.5">
      <>{condition.badgeText}</>
    </Badge>
  ));

  return (
    <li className="col-span-1 rounded-lg bg-gray-800 shadow ring-1 ring-gray-500">
      <div className="flex w-full items-center justify-between space-x-6 p-6">
        <div className="flex-1 truncate">
          <div className="mb-2 flex items-center space-x-2">
            <h3 className="truncate font-medium leading-5 text-white">
              <a
                href=""
                className="transition duration-300 hover:text-white hover:underline"
              >
                {name}
              </a>
            </h3>
          </div>
          <p className="mt-1 flex flex-wrap text-sm leading-5 text-gray-300">
            {conditionBadges}
          </p>
        </div>
      </div>
      <div className="border-t border-gray-500">
        <div className="-mt-px flex">
          <div className="flex w-0 flex-1 border-r border-gray-500">
            <button
              onClick={() => onEdit()}
              className="focus:ring-blue relative -mr-px inline-flex w-0 flex-1 items-center justify-center rounded-bl-lg border border-transparent py-4 text-sm font-medium leading-5 text-gray-200 transition duration-150 ease-in-out hover:text-white focus:z-10 focus:border-gray-500 focus:outline-none"
            >
              <PencilIcon className="mr-2 h-5 w-5" />
              <span>Edit</span>
            </button>
          </div>
          <div className="-ml-px flex w-0 flex-1">
            <button className="focus:ring-blue relative inline-flex w-0 flex-1 items-center justify-center rounded-br-lg border border-transparent py-4 text-sm font-medium leading-5 text-gray-200 transition duration-150 ease-in-out hover:text-white focus:z-10 focus:border-gray-500 focus:outline-none">
              <TrashIcon className="mr-2 h-5 w-5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </li>
  );
};

const SettingsAutoApproval = () => {
  const { data: mockData } = useSWR<AutoApprovalRule[]>(
    '/api/v1/autoApprovalRule'
  );
  const movieRuleData = mockData;
  const [editRuleModal, setEditRuleModal] = useState<{
    open: boolean;
    approvalRule: AutoApprovalRule | null;
  }>({
    open: false,
    approvalRule: null,
  });
  return (
    <div className="mt-6">
      <div className="mt-10 text-white">
        <div className="flex flex-col justify-between lg:flex-row lg:items-end">
          <Header>Auto Approval Rules</Header>
        </div>
        {editRuleModal.open && (
          <RuleModal
            approvalRule={editRuleModal.approvalRule}
            onClose={() =>
              setEditRuleModal({ open: false, approvalRule: null })
            }
            onSave={() => {
              setEditRuleModal({ open: false, approvalRule: null });
            }}
          />
        )}
        <h3 className="heading">Movie Auto-approval rules</h3>
        <div className="section">
          <ul className="xl:grid-cols3 grid max-w-4xl grid-cols-1 gap-6 lg:grid-cols-2">
            {movieRuleData &&
              movieRuleData.map((rule) => (
                <ApprovalRuleInstance
                  key={`approval-rule-`}
                  name={rule.name}
                  onEdit={() =>
                    setEditRuleModal({
                      open: true,
                      approvalRule: rule,
                    })
                  }
                  currentRule={{
                    name: rule.name,
                    conditions: rule.conditions,
                  }}
                />
              ))}
            <li className="col-span-1 h-32 rounded-lg border-2 border-dashed border-gray-400 shadow sm:h-44">
              <div className="flex h-full w-full items-center justify-center">
                <Button
                  buttonType="ghost"
                  className="mt-3 mb-3"
                  onClick={() =>
                    setEditRuleModal({
                      open: true,
                      approvalRule: {
                        name: 'Test rule',
                        conditions: [],
                      },
                    })
                  }
                >
                  <PlusIcon />
                  <span>Add Rule</span>
                </Button>
              </div>
            </li>
          </ul>
        </div>
        <h3 className="heading">Series Auto-approval rules</h3>
        <div className="section">
          <ul className="xl:grid-cols3 grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2">
            <li className="col-span-1 h-32 rounded-lg border-2 border-dashed border-gray-400 shadow sm:h-44">
              <div className="flex h-full w-full items-center justify-center">
                <Button buttonType="ghost" className="mt-3 mb-3">
                  <PlusIcon />
                  <span>Add Rule</span>
                </Button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SettingsAutoApproval;
