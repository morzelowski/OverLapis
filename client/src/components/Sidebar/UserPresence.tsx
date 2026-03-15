import { useEffect, useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useYjsContext } from '../../hooks/YjsContext';

interface RemoteUser {
  name: string;
  color: string;
  clientId: number;
}

export default function UserPresence() {
  const { currentUser } = useAppStore();
  const { awareness } = useYjsContext();
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);

  useEffect(() => {
    if (!awareness) {
      setRemoteUsers([]);
      return;
    }

    function updateUsers() {
      const users: RemoteUser[] = [];
      awareness!.getStates().forEach((state, clientId) => {
        if (clientId !== awareness!.clientID && state.user) {
          users.push({
            name: state.user.name,
            color: state.user.color,
            clientId,
          });
        }
      });
      setRemoteUsers(users);
    }

    updateUsers();
    awareness.on('change', updateUsers);
    return () => {
      awareness.off('change', updateUsers);
    };
  }, [awareness]);

  return (
    <div className="user-presence">
      <div className="sidebar-section-title">USERS</div>
      <div className="user-presence-item">
        <div
          className="user-presence-dot"
          style={{ background: currentUser.color }}
        />
        <span className="user-presence-name">{currentUser.name}</span>
        <span className="user-presence-you">(you)</span>
      </div>
      {remoteUsers.map((user) => (
        <div key={user.clientId} className="user-presence-item">
          <div
            className="user-presence-dot"
            style={{ background: user.color }}
          />
          <span className="user-presence-name">{user.name}</span>
        </div>
      ))}
    </div>
  );
}
