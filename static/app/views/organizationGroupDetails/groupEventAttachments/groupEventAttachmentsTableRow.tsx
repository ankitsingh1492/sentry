import styled from '@emotion/styled';

import DateTime from 'sentry/components/dateTime';
import EventAttachmentActions from 'sentry/components/events/eventAttachmentActions';
import FileSize from 'sentry/components/fileSize';
import Link from 'sentry/components/links/link';
import {t} from 'sentry/locale';
import {IssueAttachment} from 'sentry/types';
import AttachmentUrl from 'sentry/utils/attachmentUrl';
import {types} from 'sentry/views/organizationGroupDetails/groupEventAttachments/types';

type Props = {
  orgId: string;
  projectId: string;
  groupId: string;
  attachment: IssueAttachment;
  onDelete: (attachmentId: string) => void;
  isDeleted: boolean;
};

const GroupEventAttachmentsTableRow = ({
  attachment,
  projectId,
  onDelete,
  isDeleted,
  orgId,
  groupId,
}: Props) => (
  <TableRow isDeleted={isDeleted}>
    <td>
      <h5>
        {attachment.name}
        <br />
        <small>
          <DateTime date={attachment.dateCreated} /> &middot;{' '}
          <Link
            to={`/organizations/${orgId}/issues/${groupId}/events/${attachment.event_id}/`}
          >
            {attachment.event_id}
          </Link>
        </small>
      </h5>
    </td>

    <td>{types[attachment.type] || t('Other')}</td>

    <td>
      <FileSize bytes={attachment.size} />
    </td>

    <td>
      <ActionsWrapper>
        <AttachmentUrl
          projectId={projectId}
          eventId={attachment.event_id}
          attachment={attachment}
        >
          {url =>
            !isDeleted && (
              <EventAttachmentActions
                url={url}
                onDelete={onDelete}
                attachmentId={attachment.id}
              />
            )
          }
        </AttachmentUrl>
      </ActionsWrapper>
    </td>
  </TableRow>
);

const TableRow = styled('tr')<{isDeleted: boolean}>`
  opacity: ${p => (p.isDeleted ? 0.3 : 1)};
  td {
    text-decoration: ${p => (p.isDeleted ? 'line-through' : 'normal')};
  }
`;

const ActionsWrapper = styled('div')`
  display: inline-block;
`;

export default GroupEventAttachmentsTableRow;
