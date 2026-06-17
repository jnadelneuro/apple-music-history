import React from 'react';

/**
 * Left navigation. `groups` is an array of { label, items: [{ id, label, badge }] }.
 */
function Sidebar({ groups, activeView, onSelect }) {
    return (
        <nav className="amh-sidebar">
            <div className="amh-sidebar__brand">
                <span className="dot" />
                Apple Music History
            </div>
            {groups.map((group) => (
                <div key={group.label}>
                    <div className="amh-sidebar__group-label">{group.label}</div>
                    {group.items.map((item) => (
                        <button
                            key={item.id}
                            className={'amh-navitem' + (activeView === item.id ? ' is-active' : '')}
                            onClick={() => onSelect(item.id)}
                        >
                            <span>{item.label}</span>
                            {item.badge ? <span className="amh-navitem__badge">{item.badge}</span> : null}
                        </button>
                    ))}
                </div>
            ))}
        </nav>
    );
}

export default Sidebar;
