"use client";

import {
  ChevronDown,
  ChevronRight,
  FileText,
  LucideIcon,
} from "lucide-react";
import { useState } from "react";

export interface MenuItem {
  id: string;
  title: string;
  phuTrach?: string;
  subItems?: { id: string; title: string }[];
}

export interface SubSection {
  id: string;
  title: string;
  icon: LucideIcon;
  items: MenuItem[];
}

export interface MenuSection {
  id: string;
  title: string;
  icon: LucideIcon;
  items?: MenuItem[];
  subSections?: SubSection[];
}

interface SidebarMenuProps {
  title: string;
  titleIcon: LucideIcon;
  menuStructure: MenuSection[];
  selectedItem: string;
  onSelectItem: (id: string) => void;
}

export default function SidebarMenu({
  title,
  titleIcon: TitleIcon,
  menuStructure,
  selectedItem,
  onSelectItem,
}: SidebarMenuProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(
    menuStructure.map((s) => s.id)
  );
  const [expandedSubSections, setExpandedSubSections] = useState<string[]>([]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const toggleSubSection = (subSectionId: string) => {
    setExpandedSubSections((prev) =>
      prev.includes(subSectionId)
        ? prev.filter((id) => id !== subSectionId)
        : [...prev, subSectionId]
    );
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <TitleIcon className="text-blue-600" size={24} />
          {title}
        </h2>
      </div>

      <div className="p-2">
        {menuStructure.map((section) => {
          const SectionIcon = section.icon;
          const isExpanded = expandedSections.includes(section.id);

          return (
            <div key={section.id} className="mb-2">
              {/* Main Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left font-semibold text-gray-900 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
              >
                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                <SectionIcon size={18} className="text-green-700" />
                <span className="text-sm">{section.title}</span>
              </button>

              {/* Section Items */}
              {isExpanded && section.items && section.items.length > 0 && (
                <div className="ml-4 mt-1 space-y-1">
                  {section.items.map((item) => (
                    <div key={item.id}>
                      {item.subItems ? (
                        <div>
                          <div className="px-3 py-2 text-sm text-gray-600 font-medium">
                            {item.title}:
                          </div>
                          <div className="ml-4 space-y-1">
                            {item.subItems.map((subItem) => (
                              <button
                                key={subItem.id}
                                onClick={() => onSelectItem(subItem.id)}
                                className={`w-full flex items-start gap-2 px-3 py-1.5 text-left text-sm rounded-lg transition-colors ${
                                  selectedItem === subItem.id
                                    ? "bg-blue-100 text-blue-700"
                                    : "text-gray-600 hover:bg-gray-100"
                                }`}
                              >
                                <span>+ {subItem.title}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => onSelectItem(item.id)}
                          className={`w-full flex items-start gap-2 px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                            selectedItem === item.id
                              ? "bg-blue-100 text-blue-700"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <FileText size={16} className="mt-0.5 shrink-0" />
                          <span>{item.title}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Sub Sections */}
              {isExpanded && section.subSections && (
                <div className="ml-2 mt-1 space-y-1">
                  {section.subSections.map((subSection) => {
                    const SubIcon = subSection.icon;
                    const isSubExpanded = expandedSubSections.includes(subSection.id);

                    return (
                      <div key={subSection.id}>
                        <button
                          onClick={() => toggleSubSection(subSection.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {isSubExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          <SubIcon size={16} className="text-gray-600" />
                          <span>{subSection.title}</span>
                        </button>

                        {isSubExpanded && subSection.items && (
                          <div className="ml-6 mt-1 space-y-1">
                            {subSection.items.map((item) => (
                              <div key={item.id}>
                                {item.subItems ? (
                                  <div>
                                    <div className="px-3 py-2 text-sm text-gray-600">
                                      {item.title}:
                                    </div>
                                    <div className="ml-4 space-y-1">
                                      {item.subItems.map((subItem) => (
                                        <button
                                          key={subItem.id}
                                          onClick={() => onSelectItem(subItem.id)}
                                          className={`w-full flex items-start gap-2 px-3 py-1.5 text-left text-sm rounded-lg transition-colors ${
                                            selectedItem === subItem.id
                                              ? "bg-blue-100 text-blue-700"
                                              : "text-gray-600 hover:bg-gray-100"
                                          }`}
                                        >
                                          <span>+ {subItem.title}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => onSelectItem(item.id)}
                                    className={`w-full flex items-start gap-2 px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                                      selectedItem === item.id
                                        ? "bg-blue-100 text-blue-700"
                                        : "text-gray-700 hover:bg-gray-100"
                                    }`}
                                  >
                                    <FileText size={14} className="mt-0.5 shrink-0" />
                                    <span>{item.title}</span>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
