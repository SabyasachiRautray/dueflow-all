// Domain workflow: the human approval gate for a payment plan.
// Records the decision, then moves the plan to its next status.
import { api } from './api';

const NEXT_PLAN_STATUS = { approved: 'approved', rejected: 'rejected', changes_requested: 'pending_approval' };

export const approvalApi = api.injectEndpoints({
  endpoints: (build) => ({
    decidePlan: build.mutation({
      async queryFn({ planId, approverId, decision, comment }, _api, _extra, baseQuery) {
        const created = await baseQuery({
          url: '/approvals',
          method: 'POST',
          body: { plan_id: planId, approver_id: approverId, decision, comment },
        });
        if (created.error) return { error: created.error };
        const updated = await baseQuery({
          url: `/payment-plans/${planId}`,
          method: 'PUT',
          body: { status: NEXT_PLAN_STATUS[decision] },
        });
        if (updated.error) return { error: updated.error };
        // Audit trail ("logs every decision"). The decision itself is already saved,
        // so a failure here must not make the whole action look failed. Actor is set server-side.
        await baseQuery({
          url: '/audit-logs',
          method: 'POST',
          body: { action: `plan_${decision}`, entity_type: 'payment_plan', entity_id: planId, details: { comment: comment || null } },
        });
        return { data: updated.data };
      },
      invalidatesTags: (_r, _e, { planId }) => [
        { type: 'Resource', id: 'LIST-approvals' },
        { type: 'Resource', id: 'LIST-payment-plans' },
        { type: 'Resource', id: 'LIST-audit-logs' },
        { type: 'Resource', id: `payment-plans-${planId}` },
      ],
    }),
  }),
});

export const { useDecidePlanMutation } = approvalApi;
