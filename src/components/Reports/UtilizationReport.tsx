import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer, Calendar, Filter, BarChart3 } from 'lucide-react';
import { Resource, Project, DateRange, ResourceUtilization } from '../../types';
import { dateRangeService } from '../../services/dateRangeService';
import { utilizationService } from '../../services/utilizationService';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface UtilizationReportProps {
  resources: Resource[];
  projects: Project[];
}

interface ReportData {
  resourceName: string;
  department: string;
  availability: string;
  projects: { [projectName: string]: number };
  totalUtilization: number;
}

export function UtilizationReport({ resources, projects }: UtilizationReportProps) {
  const [dateRanges, setDateRanges] = useState<DateRange[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState<string>('');
  const [utilizations, setUtilizations] = useState<ResourceUtilization[]>([]);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('');

  const activeResources = resources.filter(r => r.status === 'Active');
  const activeProjects = projects.filter(p => p.status === 'Active');
  const departments = [...new Set(activeResources.map(r => r.department))];

  useEffect(() => {
    loadDateRanges();
  }, []);

  useEffect(() => {
    if (selectedDateRange) {
      loadUtilizationData();
    }
  }, [selectedDateRange]);

  useEffect(() => {
    generateReportData();
  }, [utilizations, filterDepartment, filterAvailability]);

  const loadDateRanges = async () => {
    try {
      const ranges = await dateRangeService.getAll();
      setDateRanges(ranges);
      
      // Auto-select active date range
      const activeRange = ranges.find(r => r.is_active);
      if (activeRange) {
        setSelectedDateRange(activeRange.id);
      }
    } catch (error) {
      console.error('Error loading date ranges:', error);
    }
  };

  const loadUtilizationData = async () => {
    if (!selectedDateRange) return;
    
    try {
      setLoading(true);
      const data = await utilizationService.getByDateRange(selectedDateRange);
      setUtilizations(data);
    } catch (error) {
      console.error('Error loading utilization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReportData = () => {
    let filteredResources = activeResources;
    
    if (filterDepartment) {
      filteredResources = filteredResources.filter(r => r.department === filterDepartment);
    }
    
    if (filterAvailability) {
      filteredResources = filteredResources.filter(r => r.availability === filterAvailability);
    }

    // Get unique projects from utilization data (includes historical projects)
    const utilizationProjects = Array.from(
      new Set(utilizations.map(u => u.projectShortName))
    ).map(shortName => {
      const util = utilizations.find(u => u.projectShortName === shortName);
      return {
        id: util?.projectId || '',
        shortName: shortName,
        name: util?.projectName || shortName
      };
    });

    const data: ReportData[] = filteredResources.map(resource => {
      const resourceUtilizations = utilizations.filter(u => u.resourceId === resource.id);
      const projects: { [projectName: string]: number } = {};
      let totalUtilization = 0;

      utilizationProjects.forEach(project => {
        const util = resourceUtilizations.find(u => u.projectShortName === project.shortName);
        const utilValue = util?.utilization || 0;
        projects[project.shortName] = utilValue;
        totalUtilization += utilValue;
      });

      return {
        resourceName: resource.name,
        department: resource.department,
        availability: resource.availability,
        projects,
        totalUtilization,
      };
    });

    setReportData(data);
  };

  const exportToExcel = () => {
    if (!selectedDateRange || reportData.length === 0) return;

    const selectedRange = dateRanges.find(r => r.id === selectedDateRange);
    const rangeName = selectedRange?.name || 'Unknown Range';

    // Get unique projects from utilization data
    const utilizationProjects = Array.from(
      new Set(utilizations.map(u => u.projectShortName))
    ).map(shortName => {
      const util = utilizations.find(u => u.projectShortName === shortName);
      return {
        shortName: shortName,
        name: util?.projectName || shortName
      };
    });

    // Create worksheet data
    const wsData = [
      [`Resource Utilization Report - ${rangeName}`],
      [`Generated on: ${new Date().toLocaleDateString()}`],
      [`Period: ${selectedRange ? `${new Date(selectedRange.start_date).toLocaleDateString()} - ${new Date(selectedRange.end_date).toLocaleDateString()}` : 'N/A'}`],
      [],
      ['Resource Name', 'Department', 'Availability', ...utilizationProjects.map(p => p.shortName), 'Total %'],
      ...reportData.map(row => [
        row.resourceName,
        row.department,
        row.availability,
        ...utilizationProjects.map(p => row.projects[p.shortName] || 0),
        row.totalUtilization,
      ]),
      [],
      ['Summary Statistics'],
      ['Total Resources:', reportData.length],
      ['Average Utilization:', reportData.length > 0 ? Math.round(reportData.reduce((sum, r) => sum + r.totalUtilization, 0) / reportData.length) + '%' : '0%'],
      ['Resources Over 100%:', reportData.filter(r => r.totalUtilization > 100).length],
      ['Resources Under 50%:', reportData.filter(r => r.totalUtilization < 50).length],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // Resource Name
      { wch: 15 }, // Department
      { wch: 12 }, // Availability
      ...utilizationProjects.map(() => ({ wch: 10 })), // Project columns
      { wch: 10 }, // Total
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Utilization Report');
    
    XLSX.writeFile(wb, `utilization-report-${rangeName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const printReport = () => {
    if (!selectedDateRange || reportData.length === 0) return;

    const selectedRange = dateRanges.find(r => r.id === selectedDateRange);
    const rangeName = selectedRange?.name || 'Unknown Range';

    // Get unique projects from utilization data
    const utilizationProjects = Array.from(
      new Set(utilizations.map(u => u.projectShortName))
    ).map(shortName => {
      const util = utilizations.find(u => u.projectShortName === shortName);
      return {
        shortName: shortName,
        name: util?.projectName || shortName
      };
    });

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(16);
    doc.text(`Resource Utilization Report - ${rangeName}`, 14, 20);
    
    // Metadata
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    if (selectedRange) {
      doc.text(`Period: ${new Date(selectedRange.start_date).toLocaleDateString()} - ${new Date(selectedRange.end_date).toLocaleDateString()}`, 14, 36);
    }

    // Table headers
    const headers = ['Resource', 'Dept', 'Avail', ...utilizationProjects.map(p => p.shortName), 'Total%'];
    
    // Table data
    const tableData = reportData.map(row => [
      row.resourceName,
      row.department,
      row.availability,
      ...utilizationProjects.map(p => (row.projects[p.shortName] || 0) + '%'),
      row.totalUtilization + '%',
    ]);

    // Add table
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 45,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
      columnStyles: {
        0: { cellWidth: 25 }, // Resource name
        1: { cellWidth: 15 }, // Department
        2: { cellWidth: 12 }, // Availability
      },
    });

    // Summary statistics
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Summary Statistics', 14, finalY);
    
    doc.setFontSize(10);
    doc.text(`Total Resources: ${reportData.length}`, 14, finalY + 8);
    doc.text(`Average Utilization: ${reportData.length > 0 ? Math.round(reportData.reduce((sum, r) => sum + r.totalUtilization, 0) / reportData.length) + '%' : '0%'}`, 14, finalY + 16);
    doc.text(`Resources Over 100%: ${reportData.filter(r => r.totalUtilization > 100).length}`, 14, finalY + 24);
    doc.text(`Resources Under 50%: ${reportData.filter(r => r.totalUtilization < 50).length}`, 14, finalY + 32);

    // Open print dialog
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };

  const getUtilizationColor = (value: number): string => {
    if (value === 0) return 'text-gray-600';
    if (value <= 25) return 'text-red-600';
    if (value <= 50) return 'text-yellow-600';
    if (value <= 75) return 'text-blue-600';
    if (value <= 100) return 'text-green-600';
    return 'text-red-800 font-bold';
  };

  const summaryStats = {
    totalResources: reportData.length,
    averageUtilization: reportData.length > 0 ? Math.round(reportData.reduce((sum, r) => sum + r.totalUtilization, 0) / reportData.length) : 0,
    overUtilized: reportData.filter(r => r.totalUtilization > 100).length,
    underUtilized: reportData.filter(r => r.totalUtilization < 50).length,
    fullyUtilized: reportData.filter(r => r.totalUtilization >= 75 && r.totalUtilization <= 100).length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-600" />
            Utilization Report
          </h1>
          <p className="text-gray-600 mt-2">Generate and export resource utilization reports</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={exportToExcel}
            disabled={!selectedDateRange || reportData.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
          
          <button
            onClick={printReport}
            disabled={!selectedDateRange || reportData.length === 0}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Filters and Date Range Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Report Configuration
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select Date Range</option>
              {dateRanges.map(range => (
                <option key={range.id} value={range.id}>
                  {range.name}{range.is_active ? ' (Active)' : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
            <select
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Locations</option>
              <option value="Onshore">Onshore</option>
              <option value="Offshore">Offshore</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterDepartment('');
                setFilterAvailability('');
              }}
              className="w-full px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      {selectedDateRange && reportData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Resources</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.totalResources}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Utilization</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.averageUtilization}%</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">%</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Over-utilized</p>
                <p className="text-2xl font-bold text-red-600">{summaryStats.overUtilized}</p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold text-sm">!</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fully Utilized</p>
                <p className="text-2xl font-bold text-green-600">{summaryStats.fullyUtilized}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">✓</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Under-utilized</p>
                <p className="text-2xl font-bold text-yellow-600">{summaryStats.underUtilized}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 font-bold text-sm">-</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Table */}
      {selectedDateRange ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Utilization Details
                {dateRanges.find(r => r.id === selectedDateRange) && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    - {dateRanges.find(r => r.id === selectedDateRange)?.name}
                  </span>
                )}
              </h2>
              {loading && (
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  Loading...
                </div>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  {Array.from(new Set(utilizations.map(u => u.projectShortName))).map(shortName => (
                    <th key={shortName} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {shortName}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">Total %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.resourceName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {row.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        row.availability === 'Onshore' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {row.availability}
                      </span>
                    </td>
                    {Array.from(new Set(utilizations.map(u => u.projectShortName))).map(shortName => (
                      <td key={shortName} className="px-3 py-4 text-center text-sm">
                        <span className={getUtilizationColor(row.projects[shortName] || 0)}>
                          {row.projects[shortName] || 0}%
                        </span>
                      </td>
                    ))}
                    <td className="px-6 py-4 text-center font-bold bg-blue-50">
                      <span className={getUtilizationColor(row.totalUtilization)}>
                        {row.totalUtilization}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {reportData.length === 0 && !loading && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {selectedDateRange ? 'No utilization data found for the selected criteria' : 'Select a date range to generate report'}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Date Range</h3>
            <p className="text-gray-500">Choose a date range to generate the utilization report</p>
          </div>
        </div>
      )}
    </div>
  );
}