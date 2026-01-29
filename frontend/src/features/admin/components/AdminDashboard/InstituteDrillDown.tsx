import React, { useState, useMemo, useEffect } from "react";
import { Building2, Users, BookOpen, ChevronRight, Search, Plus, Edit, Trash2 } from "lucide-react";
import type { Institute } from "../../services/adminService";

interface InstituteDrillDownProps {
  institutes: Institute[];
  onSelectInstitute: (institute: Institute) => void;
  onAdd?: () => void;
  onEdit?: (institute: Institute) => void;
  onDelete?: (id: number) => void;
}

export default function InstituteDrillDown({
  institutes,
  onSelectInstitute,
  onAdd,
  onEdit,
  onDelete
}: InstituteDrillDownProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Reset pagination on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // ======================================================
  // Filter + sort institutes (SAFE)
  // ======================================================
  const filteredInstitutes = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return institutes
      .filter(inst => {
        const name = inst.institute_name ?? inst.name ?? "";
        const city = inst.city ?? "";
        return (
          name.toLowerCase().includes(q) ||
          city.toLowerCase().includes(q)
        );
      })
      .sort((a, b) =>
        (a.institute_name ?? a.name ?? "")
          .localeCompare(b.institute_name ?? b.name ?? "")
      );
  }, [institutes, searchTerm]);

  const totalPages = Math.ceil(filteredInstitutes.length / itemsPerPage);

  const paginatedInstitutes = filteredInstitutes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4">
      {/* ================= HEADER WITH ADD BUTTON ================= */}
      {onAdd && (
        <div className="bg-white/95 backdrop-blur rounded-lg p-4 shadow-sm flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Colleges Directory</h3>
            <p className="text-sm text-gray-500">Manage affiliated colleges</p>
          </div>
          <button
            onClick={onAdd}
            className="bg-[#650C08] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#8B1A1A] shadow-sm transition-all"
          >
            <Plus size={18} /> Add College
          </button>
        </div>
      )}

      {/* ================= SEARCH ================= */}
      <div className="bg-white/95 backdrop-blur rounded-lg p-2 shadow-sm">
        <div className="relative">
          <Search
            className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search institutes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#650C08] focus:border-transparent"
          />
        </div>
      </div>

      {/* ================= INSTITUTE GRID ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedInstitutes.map(institute => (
          <div
            key={institute.institute_id}
            className="bg-white/95 backdrop-blur rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-[#650C08] group relative"
          >
            {/* Edit/Delete Buttons (visible on hover) */}
            {(onEdit || onDelete) && (
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(institute);
                    }}
                    className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-md"
                  >
                    <Edit size={14} />
                  </button>
                )}
                {onDelete && institute.institute_id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(institute.institute_id!);
                    }}
                    className="p-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors shadow-md"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}

            {/* Card content with click handler */}
            <div onClick={() => onSelectInstitute(institute)}>
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#650C08] to-[#8B1A1A] flex items-center justify-center">
                    <Building2 className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm group-hover:text-[#650C08]">
                      {institute.institute_name ?? institute.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {institute.institute_code ?? institute.code ?? "N/A"}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className="text-gray-400 group-hover:text-[#650C08] group-hover:translate-x-1 transition-all"
                  size={16}
                />
              </div>

              {/* Location */}
              {institute.city && (
                <p className="text-xs text-gray-600 mb-2">
                  📍 {institute.city}
                  {institute.state ? `, ${institute.state}` : ""}
                </p>
              )}

              {/* Stats (DISPLAY ONLY – BACKEND DRIVEN) */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-blue-50 rounded-lg p-2">
                  <BookOpen className="mx-auto mb-1 text-blue-600" size={16} />
                  <p className="text-sm font-bold text-blue-900">
                    {institute.total_courses ?? 0}
                  </p>
                  <p className="text-xs text-blue-600">Courses</p>
                </div>

                <div className="bg-green-50 rounded-lg p-2">
                  <Users className="mx-auto mb-1 text-green-600" size={16} />
                  <p className="text-sm font-bold text-green-900">
                    {institute.total_students ?? 0}
                  </p>
                  <p className="text-xs text-green-600">Students</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-2">
                  <Users className="mx-auto mb-1 text-purple-600" size={16} />
                  <p className="text-sm font-bold text-purple-900">
                    {institute.active_students ?? 0}
                  </p>
                  <p className="text-xs text-purple-600">Active</p>
                </div>
              </div>

              {/* Contact */}
              {institute.contact_number && (
                <p className="text-xs text-gray-500 mt-2">
                  Contact: {institute.contact_number}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* ================= PAGINATION ================= */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-4 text-sm">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* ================= EMPTY STATE ================= */}
        {filteredInstitutes.length === 0 && (
          <div className="bg-white/95 rounded-lg p-8 text-center shadow-sm">
            <Building2 className="mx-auto mb-2 text-gray-300" size={36} />
            <p className="text-gray-500 font-medium">No institutes found</p>
            <p className="text-xs text-gray-400 mt-1">
              Try adjusting your search criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
